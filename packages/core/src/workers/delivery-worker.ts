import { Worker, UnrecoverableError } from 'bullmq';
import { eq } from 'drizzle-orm';
import { createRedisConnection } from '../queue/redis';
import { adminDb } from '../db/client';
import { messages, endpoints, deliveryAttempts } from '../db/schema';
import { buildWebhookHeaders } from '../signing/webhook-signer';
import {
  webhookBackoffStrategy,
  MAX_DELIVERY_ATTEMPTS,
  computeBackoffDelay,
} from '../queue/backoff';
import type { DeliveryJobData } from '../queue/delivery-queue';
import { applyTransformation } from '../transformation/transform';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BODY_LENGTH = 1024;
const CIRCUIT_BREAKER_THRESHOLD = 10;

/** HTTP status codes that indicate a permanent error — do not retry. */
const NON_RETRIABLE_CODES = new Set([400, 401, 403, 404, 410]);

export interface DeliveryResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  responseTimeMs: number;
  errorMessage: string | null;
}

/**
 * Deliver a webhook to a customer endpoint via HTTP POST.
 * Uses native fetch with AbortSignal.timeout for configurable timeouts.
 */
export async function deliverWebhook(
  url: string,
  payload: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<DeliveryResult> {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmitHQ/1.0',
        ...headers,
      },
      body: payload,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseTimeMs = Date.now() - startedAt;
    const rawBody = await response.text();
    const responseBody = rawBody.slice(0, MAX_RESPONSE_BODY_LENGTH);

    return {
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      responseBody,
      responseTimeMs,
      errorMessage: null,
    };
  } catch (err: unknown) {
    const responseTimeMs = Date.now() - startedAt;

    if (err instanceof Error && err.name === 'TimeoutError') {
      return {
        success: false,
        statusCode: null,
        responseBody: null,
        responseTimeMs,
        errorMessage: `Delivery timed out after ${timeoutMs}ms`,
      };
    }

    return {
      success: false,
      statusCode: null,
      responseBody: null,
      responseTimeMs,
      errorMessage: err instanceof Error ? err.message : 'Unknown delivery error',
    };
  }
}

/**
 * Process a single delivery job: load data, sign, POST, record result.
 * Exported for testability — called by the BullMQ Worker processor.
 *
 * @param data - Job payload with message/endpoint/attempt IDs
 * @param attemptsMade - BullMQ attempt count (0 on first try, increments on retries)
 */
export async function processDeliveryJob(data: DeliveryJobData, attemptsMade = 0): Promise<void> {
  // Load message payload
  const [message] = await adminDb
    .select({
      id: messages.id,
      payload: messages.payload,
      eventType: messages.eventType,
    })
    .from(messages)
    .where(eq(messages.id, data.messageId))
    .limit(1);

  if (!message) {
    throw new UnrecoverableError(`Message ${data.messageId} not found`);
  }

  // Load endpoint config
  const [endpoint] = await adminDb
    .select({
      id: endpoints.id,
      url: endpoints.url,
      signingSecret: endpoints.signingSecret,
      disabled: endpoints.disabled,
      failureCount: endpoints.failureCount,
      rateLimit: endpoints.rateLimit,
      transformRules: endpoints.transformRules,
    })
    .from(endpoints)
    .where(eq(endpoints.id, data.endpointId))
    .limit(1);

  if (!endpoint) {
    throw new UnrecoverableError(`Endpoint ${data.endpointId} not found`);
  }

  // Skip disabled endpoints
  if (endpoint.disabled) {
    await adminDb
      .update(deliveryAttempts)
      .set({
        status: 'failed',
        errorMessage: 'Endpoint is disabled',
        attemptedAt: new Date(),
      })
      .where(eq(deliveryAttempts.id, data.attemptId));

    throw new UnrecoverableError(`Endpoint ${data.endpointId} is disabled`);
  }

  // Apply per-endpoint payload transformation (passthrough if no rules)
  const transformedPayload = applyTransformation(
    message.payload,
    endpoint.transformRules as import('../transformation/transform').TransformRule[] | null,
  );

  // Serialize payload and sign
  const payloadStr = JSON.stringify(transformedPayload);
  const webhookHeaders = buildWebhookHeaders(message.id, payloadStr, endpoint.signingSecret);

  // Deliver
  const timeoutMs = endpoint.rateLimit
    ? Math.min(endpoint.rateLimit * 1000, DEFAULT_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
  const result = await deliverWebhook(endpoint.url, payloadStr, webhookHeaders, timeoutMs);

  // Compute next retry time for display (if this attempt fails and retries remain)
  const nextRetryDelay =
    !result.success && attemptsMade + 1 < MAX_DELIVERY_ATTEMPTS
      ? computeBackoffDelay(attemptsMade + 1)
      : null;

  // Record the attempt
  await adminDb
    .update(deliveryAttempts)
    .set({
      status: result.success ? 'delivered' : 'failed',
      attemptNumber: attemptsMade + 1,
      responseStatus: result.statusCode,
      responseBody: result.responseBody,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
      attemptedAt: new Date(),
      nextAttemptAt: nextRetryDelay !== null ? new Date(Date.now() + nextRetryDelay) : null,
    })
    .where(eq(deliveryAttempts.id, data.attemptId));

  if (result.success) {
    // Reset failure counter on success
    await adminDb
      .update(endpoints)
      .set({ failureCount: 0 })
      .where(eq(endpoints.id, data.endpointId));
    return;
  }

  // Failure path: increment failure counter, check circuit breaker
  const currentFailures = (endpoint.failureCount ?? 0) + 1;
  if (currentFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    await adminDb
      .update(endpoints)
      .set({
        failureCount: currentFailures,
        disabled: true,
        disabledReason: 'circuit_breaker: consecutive failure threshold reached',
      })
      .where(eq(endpoints.id, data.endpointId));
  } else {
    await adminDb
      .update(endpoints)
      .set({ failureCount: currentFailures })
      .where(eq(endpoints.id, data.endpointId));
  }

  // Non-retriable status codes — throw UnrecoverableError to skip BullMQ retries
  if (result.statusCode !== null && NON_RETRIABLE_CODES.has(result.statusCode)) {
    throw new UnrecoverableError(`Non-retriable status ${result.statusCode} from ${endpoint.url}`);
  }

  // Retriable failure — throw regular error so BullMQ schedules a retry
  throw new Error(result.errorMessage ?? `Delivery failed with status ${result.statusCode}`);
}

/**
 * Handle exhausted delivery attempts (all retries consumed).
 * Marks the delivery attempt as 'exhausted' in the database.
 */
export async function handleExhaustedDelivery(data: DeliveryJobData): Promise<void> {
  await adminDb
    .update(deliveryAttempts)
    .set({
      status: 'exhausted',
      nextAttemptAt: null,
    })
    .where(eq(deliveryAttempts.id, data.attemptId));
}

/**
 * Create and start the BullMQ delivery worker.
 * Call this from the Railway worker entry point.
 */
export function startDeliveryWorker(): Worker<DeliveryJobData> {
  const worker = new Worker<DeliveryJobData>(
    'webhook-delivery',
    async (job) => {
      await processDeliveryJob(job.data, job.attemptsMade);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
      settings: {
        backoffStrategy: webhookBackoffStrategy,
      },
    },
  );

  // Detect exhausted deliveries (all retries consumed)
  worker.on('failed', (job, _err) => {
    if (!job) return;
    const isExhausted = job.attemptsMade >= MAX_DELIVERY_ATTEMPTS;
    if (!isExhausted) return;

    // Mark as exhausted in DB (fire-and-forget — worker continues processing)
    handleExhaustedDelivery(job.data).catch(() => {});
  });

  return worker;
}
