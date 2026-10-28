import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import nodemailer, { type Transporter } from 'nodemailer';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../../users/entities/user.entity.js';
import { PasswordResetToken } from '../entities/password-reset-token.entity.js';

@Injectable()
export class PasswordResetService {
  private readonly transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    private readonly dataSource: DataSource,
  ) {
    const host = this.configService.getOrThrow<string>('email.smtpHost');
    const port = this.configService.getOrThrow<number>('email.smtpPort');
    const user = this.configService.getOrThrow<string>('email.smtpUser');
    const password = this.configService.getOrThrow<string>('email.smtpPassword');
    const secure = this.configService.getOrThrow<boolean>('email.smtpSecure');

    this.frontendUrl = this.configService.getOrThrow<string>('email.frontendUrl');
    this.emailFrom = this.configService.getOrThrow<string>('email.from');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password },
    });
  }

  /**
   * Always returns the same message (to prevent email enumeration).
   * If the email doesn't exist, we silently do nothing.
   */
  async sendResetLink(email: string): Promise<{ message: string }> {
    const userRepository = this.dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (user) {
      // Invalidate all previous unused tokens for this user
      await this.tokenRepository
        .createQueryBuilder()
        .update(PasswordResetToken)
        .set({ usedAt: new Date() })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('used_at IS NULL')
        .execute();

      const rawToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const resetToken = this.tokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt,
        usedAt: null,
      });

      await this.tokenRepository.save(resetToken);
      await this.sendResetEmail(user.email, rawToken);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Validates the token and updates the user's password.
   * Uses a transaction with a pessimistic lock to prevent race conditions.
   */
  async resetPassword(
    rawToken: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!rawToken?.trim()) {
      throw new BadRequestException('A reset token is required');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(PasswordResetToken);
      const userRepository = manager.getRepository(User);

      // Find the token with a lock
      const token = await tokenRepository
        .createQueryBuilder('token')
        .where('token.tokenHash = :tokenHash', {
          tokenHash: this.hashToken(rawToken),
        })
        .setLock('pessimistic_write')
        .getOne();

      if (!token || token.usedAt) {
        throw new BadRequestException(
          'The reset link is invalid or has already been used.',
        );
      }

      if (token.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('The reset link has expired.');
      }

      const user = await userRepository.findOne({
        where: { id: token.userId },
      });

      if (!user) {
        throw new BadRequestException('The reset link is invalid.');
      }

      // Update password
      user.password = hashedPassword;
      await userRepository.save(user);

      // Mark token as used
      token.usedAt = new Date();
      await tokenRepository.save(token);

      // Invalidate all refresh tokens (force logout everywhere)
      await manager.query('DELETE FROM refresh_tokens WHERE user_id = $1', [
        user.id,
      ]);
    });

    return { message: 'Password reset successfully. You can now sign in.' };
  }

  private async sendResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = new URL('/reset-password', this.frontendUrl);
    resetUrl.searchParams.set('token', token);

    await this.transporter.sendMail({
      from: this.emailFrom,
      to: email,
      subject: 'Reset your Roomora password',
      text: [
        'We received a request to reset your Roomora password.',
        '',
        'Click the link below to choose a new password:',
        resetUrl.toString(),
        '',
        'This link expires in 30 minutes and can only be used once.',
        '',
        'If you did not request this, you can safely ignore this email. Your password will not change.',
      ].join('\n'),
      html: `
        <h2>Reset your Roomora password</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl.toString()}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#2e1b11;text-decoration:none;border-radius:8px;font-weight:600;">
            Reset my password
          </a>
        </p>
        <p>This link expires in 30 minutes and can only be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}