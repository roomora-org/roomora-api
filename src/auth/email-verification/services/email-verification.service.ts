import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { User } from '../../../users/entities/user.entity.js';
import { createHash, randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerificationToken } from '../entities/email-verification-token.entity.js';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class EmailVerificationService {
  private readonly transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokenRepository: Repository<EmailVerificationToken>,
    private readonly dataSource: DataSource,
  ) {
    const host = this.configService.getOrThrow<string>('email.smtpHost');
    const port = this.configService.getOrThrow<number>('email.smtpPort');
    const user = this.configService.getOrThrow<string>('email.smtpUser');
    const password =
      this.configService.getOrThrow<string>('email.smtpPassword');
    const secure = this.configService.getOrThrow<boolean>('email.smtpSecure');

    this.frontendUrl =
      this.configService.getOrThrow<string>('email.frontendUrl');
    this.emailFrom = this.configService.getOrThrow<string>('email.from');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async createAndSendVerificationToken(user: User): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const verificationToken = this.verificationTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
      usedAt: null,
    });

    await this.verificationTokenRepository.save(verificationToken);
    await this.sendVerificationEmail(user.email, rawToken);
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
        throw new BadRequestException('The verification link has expired.');
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

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = new URL('/verify-email', this.frontendUrl);

    verificationUrl.searchParams.set('token', token);

    await this.transporter.sendMail({
      from: this.emailFrom,
      to: email,
      subject: 'Verify your Roomora account',
      text: [
        'Welcome to Roomora!',
        '',
        'Please verify your email using this link:',
        verificationUrl.toString(),
        '',
        'This link expires in 30 minutes.',
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),
      html: `
        <h2>Welcome to Roomora!</h2>
        <p>Please verify your email address to continue.</p>
        <p>
          <a href="${verificationUrl.toString()}">
            Verify my email
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      `,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
