import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

const HEAP_LIMIT_MB = 512;
const RSS_LIMIT_MB = 1024;

@Injectable()
export class MemoryHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'memory'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const mem = process.memoryUsage();

    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const rssMb = Math.round(mem.rss / 1024 / 1024);

    const isHealthy = heapUsedMb < HEAP_LIMIT_MB && rssMb < RSS_LIMIT_MB;

    const details = {
      heapUsedMb,
      rssMb,
      heapLimitMb: HEAP_LIMIT_MB,
      rssLimitMb: RSS_LIMIT_MB,
    };

    return isHealthy ? indicator.up(details) : indicator.down(details);
  }
}