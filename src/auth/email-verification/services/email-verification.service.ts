import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { User } from '../../../users/entities/user.entity.js';
import { createHash, randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerificationToken } from '../entities/email-verification-token.entity.js';
import { DataSource, IsNull, LessThan, Repository } from 'typeorm';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;
  private readonly expiryMinutes: number;
  private readonly resendCooldownSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly dataSource: DataSource,
  ) {
    // Read directly from process.env to match PasswordResetService behavior
    const host = process.env.SMTP_HOST as string;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER as string;
    const password = (process.env.SMTP_PASSWORD as string).trim();
    const secure =
      String(process.env.SMTP_SECURE ?? 'false')
        .toLowerCase()
        .trim() === 'true';

    this.frontendUrl = process.env.FRONTEND_URL as string;
    this.emailFrom = process.env.EMAIL_FROM as string;
    this.expiryMinutes = Number(
      process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES ?? 30,
    );
    this.resendCooldownSeconds = Number(
      process.env.EMAIL_RESEND_COOLDOWN_SECONDS ?? 60,
    );

    // Debug line — remove after it works
    console.log('SMTP Debug (Verification):', { host, port, secure, user });

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      // For port 587 with secure=false, force STARTTLS
      requireTLS: !secure,
      auth: { user, pass: password },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }

  async createAndSendVerificationToken(user: User): Promise<void> {
    const mostRecent = await this.verificationTokenRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    if (mostRecent && !mostRecent.usedAt) {
      const secondsSince =
        (Date.now() - mostRecent.createdAt.getTime()) / 1000;
      if (secondsSince < this.resendCooldownSeconds) {
        const wait = Math.ceil(this.resendCooldownSeconds - secondsSince);
        throw new BadRequestException(
          `Please wait ${wait} seconds before requesting another verification email.`,
        );
      }
    }

    await this.verificationTokenRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    const verificationToken = this.verificationTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
      usedAt: null,
    });

    await this.verificationTokenRepository.save(verificationToken);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('===========================================');
      this.logger.log(`Verification token for: ${user.email}`);
      this.logger.log(
        `URL: ${this.frontendUrl}/verify-email?token=${rawToken}`,
      );
      this.logger.log('===========================================');
    }

    try {
      await this.sendVerificationEmail(user, rawToken);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          'Failed to send verification email. Please try again later.',
        );
      }
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const userRepository = this.dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    const genericResponse = {
      message:
        'If an account with that email exists and is not verified, a new verification link has been sent.',
    };

    if (!user) return genericResponse;
    if (user.emailVerifiedAt) return genericResponse;

    try {
      await this.createAndSendVerificationToken(user);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to resend verification email', error);
    }

    return genericResponse;
  }

  async verifyEmail(rawToken: string): Promise<User> {
    if (!rawToken?.trim()) {
      throw new BadRequestException('A verification token is required.');
    }

    const user = await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(EmailVerificationToken);

      const token = await tokenRepository
        .createQueryBuilder('token')
        .where('token.tokenHash = :tokenHash', {
          tokenHash: this.hashToken(rawToken),
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!token || token.usedAt) {
        throw new BadRequestException(
          'The verification link is invalid or has already been used.',
        );
      }

      if (token.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          'The verification link has expired. Please request a new one.',
        );
      }

      const userRepository = manager.getRepository(User);

      const verifiedUser = await userRepository.findOne({
        where: { id: token.userId },
      });

      if (!verifiedUser) {
        throw new BadRequestException('The verification link is invalid.');
      }

      if (!verifiedUser.emailVerifiedAt) {
        verifiedUser.emailVerifiedAt = new Date();
        await userRepository.save(verifiedUser);
      }

      token.usedAt = new Date();
      await tokenRepository.save(token);

      return verifiedUser;
    });

    return user;
  }

  async cleanupOldTokens(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.verificationTokenRepository.delete({
      expiresAt: LessThan(cutoff),
    });
    return result.affected ?? 0;
  }

  private async sendVerificationEmail(
    user: User,
    token: string,
  ): Promise<void> {
    const verificationUrl = new URL('/verify-email', this.frontendUrl);
    verificationUrl.searchParams.set('token', token);

    const { subject, text, html } = this.buildVerificationEmail(
      user.firstName,
      verificationUrl.toString(),
    );

    await this.transporter.sendMail({
      from: this.emailFrom,
      to: user.email,
      subject,
      text,
      html,
    });

    this.logger.log(`Verification email sent to ${user.email}`);
  }

  private buildVerificationEmail(
    firstName: string,
    verificationUrl: string,
  ): { subject: string; text: string; html: string } {
    const subject = 'Verify your email to activate your Roomora account';
    const safeName = firstName?.trim() || 'there';

    const text = [
      `Hi ${safeName},`,
      '',
      'Welcome to Roomora! Please verify your email address to activate your account.',
      '',
      `Verify my email: ${verificationUrl}`,
      '',
      `This link expires in ${this.expiryMinutes} minutes.`,
      'If you did not create this account, you can safely ignore this email.',
      '',
      'The Roomora Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f3ee;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#4a2c1d 0%,#2e1b11 100%);padding:32px 32px 28px;text-align:center;">
              <div style="font-size:26px;font-weight:800;color:#fdfaf6;letter-spacing:-0.5px;">Roomora</div>
              <div style="font-size:13px;color:#d1a47a;margin-top:4px;">Smart Hotel Operations</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#2e1b11;font-weight:700;">
                Hi ${this.escapeHtml(safeName)},
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d3227;">
                Welcome to <strong>Roomora</strong>! You're one step away from activating your hotel management workspace.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3227;">
                Please verify your email address to continue.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:12px;background-color:#f59e0b;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#2e1b11;text-decoration:none;border-radius:12px;">
                      Verify my email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#72624c;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:12px;line-height:1.5;color:#a66b42;word-break:break-all;">
                <a href="${verificationUrl}" style="color:#a66b42;text-decoration:underline;">${verificationUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #ebe5da;margin:28px 0;" />
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#72624c;">
                This link expires in <strong>${this.expiryMinutes} minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#72624c;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fcfbf9;padding:24px 32px;border-top:1px solid #ebe5da;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#72624c;">
                Need help? Contact us at <a href="mailto:support@roomora.com" style="color:#a66b42;text-decoration:none;">support@roomora.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#a6957a;">
                &copy; ${new Date().getFullYear()} Roomora. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}