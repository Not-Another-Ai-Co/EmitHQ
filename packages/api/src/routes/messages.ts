import { Hono } from 'hono';
import { eq, and, or, sql, isNull } from 'drizzle-orm';
import { applications, messages, endpoints, deliveryAttempts } from '@emithq/core';
import { enqueueDelivery } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import { quotaCheck } from '../middleware/quota';
import type { AuthEnv } from '../types';

export const messageRoutes = new Hono<AuthEnv>();

// Auth + tenant scope on all routes
messageRoutes.use('*', requireAuth, tenantScope);

const MAX_PAYLOAD_BYTES = 256 * 1024; // 256KB
const MAX_EVENT_TYPE_LENGTH = 256;
const MAX_EVENT_ID_LENGTH = 256;

interface SendMessageBody {
  eventType: string;
  eventId?: string;
  payload?: unknown;
}

/**
 * POST /api/v1/app/:appId/msg/ — Send a webhook message
 *
 * Persist-before-enqueue pattern:
 * 1. Validate input
 * 2. Resolve application (by UUID or uid)
 * 3. Persist message to PostgreSQL
 * 4. Fan-out: create delivery_attempt per active endpoint
 * 5. Enqueue BullMQ jobs
 * 6. Increment org event counter
 * 7. Return 202 Accepted
 */
messageRoutes.post('/:appId/msg', quotaCheck, async (c) => {
  const appId = c.req.param('appId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  // --- Validate body size ---
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return c.json(
      {
        error: {
          code: 'payload_too_large',
          message: `Payload must be under ${MAX_PAYLOAD_BYTES / 1024}KB`,
        },
      },
      413,
    );
  }

  // --- Parse and validate body ---
  let body: SendMessageBody;
  try {
    body = await c.req.json<SendMessageBody>();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body' } }, 400);
  }

  if (!body.eventType || typeof body.eventType !== 'string' || body.eventType.trim() === '') {
    return c.json({ error: { code: 'validation_error', message: 'eventType is required' } }, 400);
  }

  if (body.eventType.length > MAX_EVENT_TYPE_LENGTH) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: `eventType must be under ${MAX_EVENT_TYPE_LENGTH} characters`,
        },
      },
      400,
    );
  }

  if (body.eventId !== undefined) {
    if (typeof body.eventId !== 'string' || body.eventId.trim() === '') {
      return c.json(
        { error: { code: 'validation_error', message: 'eventId must be a non-empty string' } },
        400,
      );
    }
    if (body.eventId.length > MAX_EVENT_ID_LENGTH) {
      return c.json(
        {
          error: {
            code: 'validation_error',
            message: `eventId must be under ${MAX_EVENT_ID_LENGTH} characters`,
          },
        },
        400,
      );
    }
  }

  if (
    body.payload !== undefined &&
    (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload))
  ) {
    return c.json(
      { error: { code: 'validation_error', message: 'payload must be a JSON object' } },
      400,
    );
  }

  // --- Resolve application ---
  const [app] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(or(eq(applications.id, appId), eq(applications.uid, appId)))
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  // --- Persist message (BEFORE queueing) ---
  let message;
  try {
    const [inserted] = await tx
      .insert(messages)
      .values({
        appId: app.id,
        orgId,
        eventId: body.eventId ?? null,
        eventType: body.eventType.trim(),
        payload: body.payload ?? {},
      })
      .returning({
        id: messages.id,
        eventType: messages.eventType,
        eventId: messages.eventId,
        createdAt: messages.createdAt,
      });
    message = inserted;
  } catch (err: unknown) {
    // Check for unique constraint violation (idempotency: same appId + eventId)
    if (isUniqueViolation(err)) {
      const [existing] = await tx
        .select({
          id: messages.id,
          eventType: messages.eventType,
          eventId: messages.eventId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(and(eq(messages.appId, app.id), eq(messages.eventId, body.eventId!)))
        .limit(1);

      if (existing) {
        return c.json({ data: existing }, 200);
      }
    }
    throw err;
  }

  // --- Fan-out: find active endpoints matching event type ---
  const activeEndpoints = await tx
    .select({ id: endpoints.id })
    .from(endpoints)
    .where(
      and(
        eq(endpoints.appId, app.id),
        eq(endpoints.disabled, false),
        or(
          isNull(endpoints.eventTypeFilter),
          sql`${endpoints.eventTypeFilter} @> ARRAY[${message.eventType}]::text[]`,
        ),
      ),
    );

  // --- Create delivery attempts ---
  if (activeEndpoints.length > 0) {
    const attemptRows = activeEndpoints.map((ep) => ({
      messageId: message.id,
      endpointId: ep.id,
      orgId,
      attemptNumber: 1,
      status: 'pending' as const,
    }));

    const inserted = await tx
      .insert(deliveryAttempts)
      .values(attemptRows)
      .returning({ id: deliveryAttempts.id, endpointId: deliveryAttempts.endpointId });

    // --- Enqueue BullMQ jobs (best-effort — message is persisted regardless) ---
    const enqueuePromises = inserted.map((attempt) =>
      enqueueDelivery({
        messageId: message.id,
        endpointId: attempt.endpointId,
        orgId,
        attemptId: attempt.id,
      }).catch(() => {
        // Queue failure is non-fatal — delivery can be recovered from DB
        // T-014 will implement a recovery sweep for pending attempts without jobs
      }),
    );
    await Promise.all(enqueuePromises);
  }

  // --- Increment org event counter ---
  await tx.execute(
    sql`UPDATE organizations SET event_count_month = event_count_month + 1 WHERE id = ${orgId}`,
  );

  return c.json({ data: message }, 202);
});

/**
 * Check if a database error is a unique constraint violation.
 * PostgreSQL error code 23505 = unique_violation.
 */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}
