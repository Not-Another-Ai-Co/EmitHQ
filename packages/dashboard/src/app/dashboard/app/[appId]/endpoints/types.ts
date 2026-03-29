import type { TransformRule } from '@/components/transform-rule-editor';

export interface Endpoint {
  id: string;
  uid: string | null;
  url: string;
  description: string | null;
  disabled: boolean;
  disabledReason: string | null;
  failureCount: number;
  eventTypeFilter: string[] | null;
  transformRules: TransformRule[] | null;
  rateLimit: number | null;
  createdAt: string;
}

export interface EndpointHealth {
  id: string;
  totalAttempts: number;
  deliveredCount: number;
  successRate: number;
  avgLatencyMs: number;
  lastDelivery: string | null;
}

export interface TestResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}
