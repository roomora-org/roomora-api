import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { statfs } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const MIN_FREE_PERCENT = 10;

@Injectable()
export class DiskHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'disk'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const stats = await statfs(tmpdir());
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bavail * stats.bsize;
      const usedPercent = ((totalBytes - freeBytes) / totalBytes) * 100;
      const freePercent = 100 - usedPercent;

      const details = {
        freePercent: Number(freePercent.toFixed(1)),
        usedPercent: Number(usedPercent.toFixed(1)),
        thresholdPercent: MIN_FREE_PERCENT,
      };

      return freePercent >= MIN_FREE_PERCENT
        ? indicator.up(details)
        : indicator.down(details);
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Disk read failed',
      });
    }
  }
}