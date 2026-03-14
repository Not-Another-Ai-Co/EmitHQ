// @emithq/sdk — Type definitions matching the EmitHQ REST API

// ─── Common ─────────────────────────────────────────────────────────────────

export interface EmitHQOptions {
  /** Base URL of the EmitHQ API (default: https://api.emithq.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  iterator: string | null;
  done: boolean;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export interface SendEventParams {
  eventType: string;
  payload?: Record<string, unknown>;
  eventId?: string;
}

export interface Message {
  id: string;
  eventType: string;
  eventId: string | null;
  createdAt: string;
}

// ─── Endpoints ──────────────────────────────────────────────────────────────

export interface CreateEndpointParams {
  url: string;
  description?: string;
  uid?: string;
  eventTypeFilter?: string[];
  rateLimit?: number;
}

export interface UpdateEndpointParams {
  url?: string;
  description?: string;
  uid?: string;
  eventTypeFilter?: string[] | null;
  rateLimit?: number | null;
  disabled?: boolean;
}

export interface Endpoint {
  id: string;
  uid: string | null;
  url: string;
  description: string | null;
  signingSecret?: string;
  eventTypeFilter: string[] | null;
  disabled: boolean;
  failureCount?: number;
  rateLimit: number | null;
  createdAt: string;
}

export interface EndpointDeleted {
  id: string;
  deleted: true;
}

export interface TestDeliveryResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

// ─── Replay ─────────────────────────────────────────────────────────────────

export interface ReplayResult {
  replayed: number;
  attempts: Array<{ attemptId: string; jobId: string }>;
}

export interface ReplayAttemptResult {
  attemptId: string;
  jobId: string;
}
