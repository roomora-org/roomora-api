import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { HealthService } from './health.service.js';
import { DatabaseHealthIndicator } from './indicators/database.health.js';
import { MemoryHealthIndicator as MemoryIndicator } from './indicators/memory.health.js';
import { DiskHealthIndicator as DiskIndicator } from './indicators/disk.health.js';
import { SmtpHealthIndicator } from './indicators/smtp.health.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DatabaseHealthIndicator,
    private readonly memory: MemoryIndicator,
    private readonly disk: DiskIndicator,
    private readonly smtp: SmtpHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  /**
   * Liveness — very fast, no external deps.
   * Use for load balancer / k8s liveness probe.
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return this.healthService.getLiveness();
  }

  /**
   * Readiness — full check of dependencies.
   * Use for load balancer readiness probe / uptime monitors.
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @HealthCheck()
  async ready() {
    return this.healthService.getReadiness();
  }

  /**
   * Full Terminus health check — same as ready but returns Terminus format.
   * Useful if you want to plug into @nestjs/terminus UI later.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.memory.isHealthy('memory'),
      () => this.disk.isHealthy('disk'),
      () => this.smtp.isHealthy('smtp'),
    ]);
  }

  /**
   * Metrics — for Platform Admin monitoring dashboard.
   * Should be protected by JwtAuthGuard + RolesGuard in production.
   * Left open here for now; add guards when you build the admin dashboard.
   */
  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  metrics() {
    return this.healthService.getMetrics();
  }
}