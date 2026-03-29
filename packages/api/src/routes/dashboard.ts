import { Hono } from 'hono';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { messages, endpoints, deliveryAttempts } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import { resolveApp } from '../lib/resolve-app';
import type { AuthEnv } from '../types';

export const dashboardRoutes = new Hono<AuthEnv>();

dashboardRoutes.use('*', requireAuth, tenantScope);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseLimit(raw: string | undefined): number {
  return Math.min(
    parseInt(raw ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
}

// ─── LIST MESSAGES ──────────────────────────────────────────────────────────

/**
 * GET /:appId/msg — List messages with filtering and cursor pagination
 * Query params: status, eventType, since, until, limit, cursor
 */
dashboardRoutes.get('/:appId/msg', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const limit = parseLimit(c.req.query('limit'));
  const cursor = c.req.query('cursor');
  const eventType = c.req.query('eventType');
  const since = c.req.query('since');
  const until = c.req.query('until');

  // Build WHERE conditions
  const conditions = [eq(messages.appId, app.id)];
  if (eventType) conditions.push(eq(messages.eventType, eventType));
  if (since) conditions.push(gte(messages.createdAt, new Date(since)));
  if (until) conditions.push(lte(messages.createdAt, new Date(until)));

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      conditions.push(
        sql`(${messages.createdAt}, ${messages.id}) < (${decoded.createdAt}, ${decoded.id})`,
      );
    } catch {
      return c.json({ error: { code: 'validation_error', message: 'Invalid cursor' } }, 400);
    }
  }

  const rows = await tx
    .select({
      id: messages.id,
      eventType: messages.eventType,
      eventId: messages.eventId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? Buffer.from(JSON.stringify({ createdAt: lastItem.createdAt, id: lastItem.id })).toString(
          'base64',
        )
      : null;

  return c.json({ data, iterator: nextCursor, done: !hasMore });
});

// ─── GET MESSAGE + ATTEMPTS ─────────────────────────────────────────────────

/**
 * GET /:appId/msg/:msgId — Get a single message with its delivery attempts
 */
dashboardRoutes.get('/:appId/msg/:msgId', async (c) => {
  const appId = c.req.param('appId');
  const msgId = c.req.param('msgId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const [msg] = await tx
    .select()
    .from(messages)
    .where(and(eq(messages.appId, app.id), eq(messages.id, msgId)))
    .limit(1);

  if (!msg) {
    return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
  }

  const attempts = await tx
    .select({
      id: deliveryAttempts.id,
      endpointId: deliveryAttempts.endpointId,
      attemptNumber: deliveryAttempts.attemptNumber,
      status: deliveryAttempts.status,
      responseStatus: deliveryAttempts.responseStatus,
      responseBody: deliveryAttempts.responseBody,
      responseTimeMs: deliveryAttempts.responseTimeMs,
      errorMessage: deliveryAttempts.errorMessage,
      nextAttemptAt: deliveryAttempts.nextAttemptAt,
      attemptedAt: deliveryAttempts.attemptedAt,
      createdAt: deliveryAttempts.createdAt,
    })
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.messageId, msgId))
    .orderBy(desc(deliveryAttempts.attemptNumber));

  return c.json({
    data: {
      ...msg,
      attempts,
    },
  });
});

// ─── LIST DELIVERY ATTEMPTS ─────────────────────────────────────────────────

/**
 * GET /:appId/msg/:msgId/attempt — List delivery attempts for a message
 */
dashboardRoutes.get('/:appId/msg/:msgId/attempt', async (c) => {
  const msgId = c.req.param('msgId');
  const tx = c.get('tx');

  const attempts = await tx
    .select({
      id: deliveryAttempts.id,
      endpointId: deliveryAttempts.endpointId,
      attemptNumber: deliveryAttempts.attemptNumber,
      status: deliveryAttempts.status,
      responseStatus: deliveryAttempts.responseStatus,
      responseTimeMs: deliveryAttempts.responseTimeMs,
      errorMessage: deliveryAttempts.errorMessage,
      nextAttemptAt: deliveryAttempts.nextAttemptAt,
      attemptedAt: deliveryAttempts.attemptedAt,
    })
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.messageId, msgId))
    .orderBy(desc(deliveryAttempts.attemptNumber));

  return c.json({ data: attempts });
});

// ─── OVERVIEW STATS ─────────────────────────────────────────────────────────

/**
 * GET /:appId/stats — Dashboard overview aggregates
 * Returns: eventsToday, successRate, activeEndpoints, pendingRetries
 */
dashboardRoutes.get('/:appId/stats', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Events in last 24 hours (timezone-agnostic rolling window)
  const [eventCount] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.appId, app.id), gte(messages.createdAt, oneDayAgo)));

  // Delivery success rate (last 24h)
  const [deliveryStats] = await tx
    .select({
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where status = 'delivered')::int`,
    })
    .from(deliveryAttempts)
    .where(
      and(eq(deliveryAttempts.orgId, c.get('orgId')), gte(deliveryAttempts.createdAt, oneDayAgo)),
    );

  // Active endpoints
  const [endpointCount] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(endpoints)
    .where(and(eq(endpoints.appId, app.id), eq(endpoints.disabled, false)));

  // Pending retries
  const [pendingCount] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(deliveryAttempts)
    .where(and(eq(deliveryAttempts.orgId, c.get('orgId')), eq(deliveryAttempts.status, 'pending')));

  const total = deliveryStats?.total ?? 0;
  const delivered = deliveryStats?.delivered ?? 0;
  const successRate = total > 0 ? Math.round((delivered / total) * 10000) / 100 : 100;

  return c.json({
    data: {
      eventsToday: eventCount?.count ?? 0,
      successRate,
      activeEndpoints: endpointCount?.count ?? 0,
      pendingRetries: pendingCount?.count ?? 0,
    },
  });
});

// ─── DLQ LIST ───────────────────────────────────────────────────────────────

/**
 * GET /:appId/dlq — List exhausted delivery attempts (dead-letter queue)
 * Cursor pagination, ordered by most recent first.
 */
dashboardRoutes.get('/:appId/dlq', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const limit = parseLimit(c.req.query('limit'));
  const cursor = c.req.query('cursor');

  const conditions = [
    eq(deliveryAttempts.orgId, c.get('orgId')),
    eq(deliveryAttempts.status, 'exhausted'),
  ];

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      conditions.push(
        sql`(${deliveryAttempts.createdAt}, ${deliveryAttempts.id}) < (${decoded.createdAt}, ${decoded.id})`,
      );
    } catch {
      return c.json({ error: { code: 'validation_error', message: 'Invalid cursor' } }, 400);
    }
  }

  const rows = await tx
    .select({
      id: deliveryAttempts.id,
      messageId: deliveryAttempts.messageId,
      endpointId: deliveryAttempts.endpointId,
      attemptNumber: deliveryAttempts.attemptNumber,
      status: deliveryAttempts.status,
      responseStatus: deliveryAttempts.responseStatus,
      errorMessage: deliveryAttempts.errorMessage,
      attemptedAt: deliveryAttempts.attemptedAt,
      createdAt: deliveryAttempts.createdAt,
    })
    .from(deliveryAttempts)
    .where(and(...conditions))
    .orderBy(desc(deliveryAttempts.createdAt), desc(deliveryAttempts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? Buffer.from(JSON.stringify({ createdAt: lastItem.createdAt, id: lastItem.id })).toString(
          'base64',
        )
      : null;

  return c.json({ data, iterator: nextCursor, done: !hasMore });
});

// ─── ENDPOINT HEALTH ────────────────────────────────────────────────────────

/**
 * GET /:appId/endpoint-health — Endpoint health with delivery stats
 * Returns each endpoint with success rate, avg latency, last delivery.
 */
dashboardRoutes.get('/:appId/endpoint-health', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  // Get endpoints with aggregated delivery stats
  const rows = await tx
    .select({
      id: endpoints.id,
      uid: endpoints.uid,
      url: endpoints.url,
      description: endpoints.description,
      disabled: endpoints.disabled,
      disabledReason: endpoints.disabledReason,
      failureCount: endpoints.failureCount,
      totalAttempts: sql<number>`count(${deliveryAttempts.id})::int`,
      deliveredCount: sql<number>`count(${deliveryAttempts.id}) filter (where ${deliveryAttempts.status} = 'delivered')::int`,
      avgLatency: sql<number>`coalesce(avg(${deliveryAttempts.responseTimeMs})::int, 0)`,
      lastDelivery: sql<string>`max(${deliveryAttempts.attemptedAt})`,
    })
    .from(endpoints)
    .leftJoin(deliveryAttempts, eq(endpoints.id, deliveryAttempts.endpointId))
    .where(
      and(
        eq(endpoints.appId, app.id),
        sql`(${endpoints.disabledReason} IS NULL OR ${endpoints.disabledReason} != 'deleted')`,
      ),
    )
    .groupBy(endpoints.id)
    .orderBy(desc(endpoints.createdAt));

  const data = rows.map((r) => ({
    id: r.id,
    uid: r.uid,
    url: r.url,
    description: r.description,
    disabled: r.disabled,
    disabledReason: r.disabledReason,
    failureCount: r.failureCount,
    totalAttempts: r.totalAttempts,
    deliveredCount: r.deliveredCount,
    successRate:
      r.totalAttempts > 0 ? Math.round((r.deliveredCount / r.totalAttempts) * 10000) / 100 : 100,
    avgLatencyMs: r.avgLatency,
    lastDelivery: r.lastDelivery,
  }));

  return c.json({ data });
});
