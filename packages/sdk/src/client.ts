// @emithq/sdk — HTTP client with typed methods and automatic retry

import { toTypedError, EmitHQError } from './errors';
import type {
  EmitHQOptions,
  PaginatedResponse,
  PaginationParams,
  SendEventParams,
  Message,
  CreateEndpointParams,
  UpdateEndpointParams,
  Endpoint,
  EndpointDeleted,
  TestDeliveryResult,
  ReplayResult,
  ReplayAttemptResult,
} from './types';

const DEFAULT_BASE_URL = 'https://api.emithq.com';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/** HTTP status codes that should NOT be retried */
const NON_RETRIABLE_CODES = new Set([400, 401, 403, 404, 410, 413]);

/** Initial retry delay in ms — doubles each attempt with jitter */
const INITIAL_RETRY_DELAY = 100;

export class EmitHQ {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(apiKey: string, options: EmitHQOptions = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  // ─── Messages ───────────────────────────────────────────────────────────

  /** Send a webhook event for delivery to all matching endpoints */
  async sendEvent(appId: string, params: SendEventParams): Promise<Message> {
    const res = await this.request<{ data: Message }>(
      'POST',
      `/api/v1/app/${encodeURIComponent(appId)}/msg`,
      params,
    );
    return res.data;
  }

  /** Replay all failed/exhausted deliveries for a message */
  async replayEvent(appId: string, msgId: string): Promise<ReplayResult> {
    const res = await this.request<{ data: ReplayResult }>(
      'POST',
      `/api/v1/app/${encodeURIComponent(appId)}/msg/${encodeURIComponent(msgId)}/retry`,
    );
    return res.data;
  }

  /** Replay a single failed delivery attempt */
  async replayAttempt(
    appId: string,
    msgId: string,
    attemptId: string,
  ): Promise<ReplayAttemptResult> {
    const res = await this.request<{ data: ReplayAttemptResult }>(
      'POST',
      `/api/v1/app/${encodeURIComponent(appId)}/msg/${encodeURIComponent(msgId)}/attempt/${encodeURIComponent(attemptId)}/retry`,
    );
    return res.data;
  }

  // ─── Endpoints ──────────────────────────────────────────────────────────

  /** Create a webhook endpoint */
  async createEndpoint(appId: string, params: CreateEndpointParams): Promise<Endpoint> {
    const res = await this.request<{ data: Endpoint }>(
      'POST',
      `/api/v1/app/${encodeURIComponent(appId)}/endpoint`,
      params,
    );
    return res.data;
  }

  /** List endpoints with cursor-based pagination */
  async listEndpoints(
    appId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Endpoint>> {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    const path = `/api/v1/app/${encodeURIComponent(appId)}/endpoint${qs ? `?${qs}` : ''}`;
    return this.request<PaginatedResponse<Endpoint>>('GET', path);
  }

  /** Get a single endpoint by ID or uid */
  async getEndpoint(appId: string, endpointId: string): Promise<Endpoint> {
    const res = await this.request<{ data: Endpoint }>(
      'GET',
      `/api/v1/app/${encodeURIComponent(appId)}/endpoint/${encodeURIComponent(endpointId)}`,
    );
    return res.data;
  }

  /** Update an endpoint */
  async updateEndpoint(
    appId: string,
    endpointId: string,
    params: UpdateEndpointParams,
  ): Promise<Endpoint> {
    const res = await this.request<{ data: Endpoint }>(
      'PUT',
      `/api/v1/app/${encodeURIComponent(appId)}/endpoint/${encodeURIComponent(endpointId)}`,
      params,
    );
    return res.data;
  }

  /** Delete (soft-delete) an endpoint */
  async deleteEndpoint(appId: string, endpointId: string): Promise<EndpointDeleted> {
    const res = await this.request<{ data: EndpointDeleted }>(
      'DELETE',
      `/api/v1/app/${encodeURIComponent(appId)}/endpoint/${encodeURIComponent(endpointId)}`,
    );
    return res.data;
  }

  /** Send a test webhook to an endpoint to verify connectivity */
  async testEndpoint(appId: string, endpointId: string): Promise<TestDeliveryResult> {
    const res = await this.request<{ data: TestDeliveryResult }>(
      'POST',
      `/api/v1/app/${encodeURIComponent(appId)}/endpoint/${encodeURIComponent(endpointId)}/test`,
    );
    return res.data;
  }

  // ─── HTTP Layer ─────────────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        const jitter = delay * Math.random();
        await sleep(jitter);
      }

      try {
        const response = await fetchWithTimeout(
          `${this.baseUrl}${path}`,
          {
            method,
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
          },
          this.timeout,
        );

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Parse error body
        let errorBody: { error?: { code?: string; message?: string } };
        try {
          errorBody = await response.json();
        } catch {
          errorBody = {};
        }

        const typedError = toTypedError(response.status, errorBody);

        // Don't retry non-retriable errors
        if (NON_RETRIABLE_CODES.has(response.status)) {
          throw typedError;
        }

        // Retriable server error — continue loop
        lastError = typedError;
      } catch (err) {
        // If it's already a typed non-retriable error, rethrow immediately
        if (err instanceof EmitHQError && NON_RETRIABLE_CODES.has(err.statusCode)) {
          throw err;
        }

        // Network errors and timeouts are retriable
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
