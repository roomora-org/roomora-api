import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailVerificationService {
  private readonly transporter: Transporter;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;

  constructor(private readonly configService: ConfigService) {
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
      auth: {
        user,
        pass: password,
      },
    });
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
}
