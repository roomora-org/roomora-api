import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { DatabaseHealthIndicator } from './indicators/database.health.js';
import { MemoryHealthIndicator } from './indicators/memory.health.js';
import { SmtpHealthIndicator } from './indicators/smtp.health.js';
import { DiskHealthIndicator } from './indicators/disk.health.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TerminusModule, AuthModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    MemoryHealthIndicator,
    SmtpHealthIndicator,
    DiskHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}