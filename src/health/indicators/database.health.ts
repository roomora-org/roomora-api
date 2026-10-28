import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'database'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.dataSource.isInitialized) {
      return indicator.down({ message: 'DataSource not initialized' });
    }

    const start = Date.now();
    try {
      // Simple and cheap query to verify the connection is alive
      await this.dataSource.query('SELECT 1');
      const latencyMs = Date.now() - start;

      return indicator.up({
        latencyMs,
        driver: this.dataSource.options.type,
      });
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return indicator.down({
        message:
          error instanceof Error ? error.message : 'Database unreachable',
      });
    }
  }
}