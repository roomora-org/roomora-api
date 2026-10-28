export interface HealthCheckResult {
  status: 'ok' | 'error';
  info?: Record<string, any>;
  error?: Record<string, any>;
  details: Record<string, any>;
}

export interface HealthSummary {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    name: string;
    status: 'up' | 'down';
    latencyMs?: number;
    message?: string;
  }[];
}