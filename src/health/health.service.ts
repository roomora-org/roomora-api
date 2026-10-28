import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthSummary } from './dto/health-response.dto.js';

const VERSION = process.env.npm_package_version ?? '0.0.0';
const ENV = process.env.NODE_ENV ?? 'development';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  getLiveness(): { status: 'ok'; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getReadiness(): Promise<HealthSummary> {
    const checks: HealthSummary['checks'] = [];

    // Database
    const dbStart = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      checks.push({
        name: 'database',
        status: 'up',
        latencyMs: Date.now() - dbStart,
      });
    } catch (err) {
      checks.push({
        name: 'database',
        status: 'down',
        latencyMs: Date.now() - dbStart,
        message: err instanceof Error ? err.message : 'Database unreachable',
      });
    }

    // Memory
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    checks.push({
      name: 'memory',
      status: heapUsedMb < 512 && rssMb < 1024 ? 'up' : 'down',
      message: `heap: ${heapUsedMb}MB, rss: ${rssMb}MB`,
    });

    const status =
      checks.every((c) => c.status === 'up')
        ? 'ok'
        : checks.some((c) => c.status === 'down' && c.name === 'database')
          ? 'down'
          : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: VERSION,
      environment: ENV,
      checks,
    };
  }

  getMetrics() {
    const mem = process.memoryUsage();
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: VERSION,
      environment: ENV,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        externalMb: Math.round(mem.external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };
  }
}