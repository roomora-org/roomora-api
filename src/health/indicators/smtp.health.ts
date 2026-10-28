import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import nodemailer from 'nodemailer';

const SMTP_TIMEOUT_MS = 5000;

@Injectable()
export class SmtpHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'smtp'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = (process.env.SMTP_PASSWORD ?? '').trim();
    const secure =
      String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';

    if (!host || !user) {
      return indicator.down({ message: 'SMTP not configured' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });

    const start = Date.now();
    try {
      await transporter.verify();
      return indicator.up({ latencyMs: Date.now() - start, host, port });
    } catch (error) {
      return indicator.down({
        message:
          error instanceof Error ? error.message : 'SMTP verify failed',
        host,
        port,
      });
    } finally {
      transporter.close();
    }
  }
}