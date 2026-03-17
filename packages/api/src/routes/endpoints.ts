import { Hono } from 'hono';
import { eq, and, or, ne, desc, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  applications,
  endpoints,
  generateSigningSecret,
  deliverWebhook,
  buildWebhookHeaders,
  validateTransformRules,
  TransformValidationError,
  trackEvent,
} from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import type { AuthEnv } from '../types';

export const endpointRoutes = new Hono<AuthEnv>();

endpointRoutes.use('*', requireAuth, tenantScope);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Validate an endpoint URL. HTTPS required in production, HTTP allowed in dev.
 */
function validateEndpointUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return null;
    if (parsed.protocol === 'http:' && process.env.NODE_ENV !== 'production') return null;
    return 'Endpoint URL must use HTTPS';
  } catch {
    return 'Invalid URL format';
  }
}

/** Mask a signing secret for display — show only prefix. */
function maskSecret(secret: string): string {
  return secret.slice(0, 10) + '...';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve an application by UUID or uid within the tenant scope. */
async function resolveApp(tx: unknown, appId: string) {
  const typedTx = tx as typeof import('@emithq/core').db;
  const condition = UUID_RE.test(appId)
    ? or(eq(applications.id, appId), eq(applications.uid, appId))
    : eq(applications.uid, appId);
  const [app] = await typedTx
    .select({ id: applications.id })
    .from(applications)
    .where(condition)
    .limit(1);
  return app ?? null;
}

// ─── CREATE ─────────────────────────────────────────────────────────────────

/**
 * POST /:appId/endpoint — Create a new webhook endpoint
 * Auto-generates a signing secret (whsec_).
 * Returns the secret in full exactly once.
 */
endpointRoutes.post('/:appId/endpoint', async (c) => {
  const appId = c.req.param('appId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const body = await c.req.json<{
    url: string;
    description?: string;
    uid?: string;
    eventTypeFilter?: string[];
    rateLimit?: number;
    transformRules?: unknown[];
  }>();

  if (!body.url || typeof body.url !== 'string') {
    return c.json({ error: { code: 'validation_error', message: 'url is required' } }, 400);
  }

  const urlError = validateEndpointUrl(body.url);
  if (urlError) {
    return c.json({ error: { code: 'validation_error', message: urlError } }, 400);
  }

  // Validate transformation rules if provided
  let validatedRules = null;
  if (body.transformRules !== undefined) {
    try {
      validatedRules = validateTransformRules(body.transformRules);
    } catch (err) {
      if (err instanceof TransformValidationError) {
        return c.json({ error: { code: 'validation_error', message: err.message } }, 400);
      }
      throw err;
    }
  }

  const signingSecret = generateSigningSecret();
  const typedTx = tx as typeof import('@emithq/core').db;

  const [created] = await typedTx
    .insert(endpoints)
    .values({
      appId: app.id,
      orgId,
      uid: body.uid ?? null,
      url: body.url,
      description: body.description ?? null,
      signingSecret,
      eventTypeFilter: body.eventTypeFilter ?? null,
      rateLimit: body.rateLimit ?? null,
      transformRules: validatedRules,
    })
    .returning();

  trackEvent('endpoint.created', orgId, { url: body.url });

  return c.json(
    {
      data: {
        id: created.id,
        uid: created.uid,
        url: created.url,
        description: created.description,
        signingSecret, // Shown once — never again
        eventTypeFilter: created.eventTypeFilter,
        disabled: created.disabled,
        rateLimit: created.rateLimit,
        transformRules: created.transformRules,
        createdAt: created.createdAt,
      },
    },
    201,
  );
});

// ─── LIST ───────────────────────────────────────────────────────────────────

/**
 * GET /:appId/endpoint — List endpoints with cursor pagination
 * Excludes soft-deleted endpoints (disabledReason = 'deleted').
 */
endpointRoutes.get('/:appId/endpoint', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const limit = Math.min(
    parseInt(c.req.query('limit') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const cursor = c.req.query('cursor');

  const typedTx = tx as typeof import('@emithq/core').db;
  let query = typedTx
    .select({
      id: endpoints.id,
      uid: endpoints.uid,
      url: endpoints.url,
      description: endpoints.description,
      eventTypeFilter: endpoints.eventTypeFilter,
      disabled: endpoints.disabled,
      failureCount: endpoints.failureCount,
      rateLimit: endpoints.rateLimit,
      transformRules: endpoints.transformRules,
      createdAt: endpoints.createdAt,
    })
    .from(endpoints)
    .where(
      and(
        eq(endpoints.appId, app.id),
        or(isNull(endpoints.disabledReason), ne(endpoints.disabledReason, 'deleted')),
      ),
    )
    .orderBy(desc(endpoints.createdAt), desc(endpoints.id))
    .limit(limit + 1); // fetch one extra to detect "has more"

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      query = typedTx
        .select({
          id: endpoints.id,
          uid: endpoints.uid,
          url: endpoints.url,
          description: endpoints.description,
          eventTypeFilter: endpoints.eventTypeFilter,
          disabled: endpoints.disabled,
          failureCount: endpoints.failureCount,
          rateLimit: endpoints.rateLimit,
          transformRules: endpoints.transformRules,
          createdAt: endpoints.createdAt,
        })
        .from(endpoints)
        .where(
          and(
            eq(endpoints.appId, app.id),
            or(isNull(endpoints.disabledReason), ne(endpoints.disabledReason, 'deleted')),
            sql`(${endpoints.createdAt}, ${endpoints.id}) < (${decoded.createdAt}, ${decoded.id})`,
          ),
        )
        .orderBy(desc(endpoints.createdAt), desc(endpoints.id))
        .limit(limit + 1);
    } catch {
      return c.json({ error: { code: 'validation_error', message: 'Invalid cursor' } }, 400);
    }
  }

  const rows = await query;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? Buffer.from(JSON.stringify({ createdAt: lastItem.createdAt, id: lastItem.id })).toString(
          'base64',
        )
      : null;

  return c.json({
    data,
    iterator: nextCursor,
    done: !hasMore,
  });
});

// ─── GET SINGLE ─────────────────────────────────────────────────────────────

/**
 * GET /:appId/endpoint/:epId — Get a single endpoint
 * Returns masked signing secret.
 */
endpointRoutes.get('/:appId/endpoint/:epId', async (c) => {
  const appId = c.req.param('appId');
  const epId = c.req.param('epId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const typedTx = tx as typeof import('@emithq/core').db;
  const [ep] = await typedTx
    .select()
    .from(endpoints)
    .where(
      and(
        eq(endpoints.appId, app.id),
        or(eq(endpoints.id, epId), eq(endpoints.uid, epId)),
        or(isNull(endpoints.disabledReason), ne(endpoints.disabledReason, 'deleted')),
      ),
    )
    .limit(1);

  if (!ep) {
    return c.json({ error: { code: 'not_found', message: 'Endpoint not found' } }, 404);
  }

  return c.json({
    data: {
      ...ep,
      signingSecret: maskSecret(ep.signingSecret),
    },
  });
});

// ─── UPDATE ─────────────────────────────────────────────────────────────────

/**
 * PUT /:appId/endpoint/:epId — Update an endpoint
 * Re-enabling a disabled endpoint resets failureCount and clears disabledReason.
 */
endpointRoutes.put('/:appId/endpoint/:epId', async (c) => {
  const appId = c.req.param('appId');
  const epId = c.req.param('epId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const typedTx = tx as typeof import('@emithq/core').db;
  const [existing] = await typedTx
    .select({ id: endpoints.id, disabled: endpoints.disabled })
    .from(endpoints)
    .where(
      and(
        eq(endpoints.appId, app.id),
        or(eq(endpoints.id, epId), eq(endpoints.uid, epId)),
        or(isNull(endpoints.disabledReason), ne(endpoints.disabledReason, 'deleted')),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: { code: 'not_found', message: 'Endpoint not found' } }, 404);
  }

  const body = await c.req.json<{
    url?: string;
    description?: string;
    eventTypeFilter?: string[] | null;
    rateLimit?: number | null;
    disabled?: boolean;
    uid?: string;
    transformRules?: unknown[] | null;
  }>();

  // Validate URL if being updated
  if (body.url !== undefined) {
    const urlError = validateEndpointUrl(body.url);
    if (urlError) {
      return c.json({ error: { code: 'validation_error', message: urlError } }, 400);
    }
  }

  // Validate transformation rules if being updated
  if (body.transformRules !== undefined && body.transformRules !== null) {
    try {
      validateTransformRules(body.transformRules);
    } catch (err) {
      if (err instanceof TransformValidationError) {
        return c.json({ error: { code: 'validation_error', message: err.message } }, 400);
      }
      throw err;
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.url !== undefined) updates.url = body.url;
  if (body.description !== undefined) updates.description = body.description;
  if (body.eventTypeFilter !== undefined) updates.eventTypeFilter = body.eventTypeFilter;
  if (body.rateLimit !== undefined) updates.rateLimit = body.rateLimit;
  if (body.uid !== undefined) updates.uid = body.uid;
  if (body.transformRules !== undefined) updates.transformRules = body.transformRules;

  // Re-enabling: reset circuit breaker state
  if (body.disabled === false && existing.disabled) {
    updates.disabled = false;
    updates.disabledReason = null;
    updates.failureCount = 0;
  } else if (body.disabled !== undefined) {
    updates.disabled = body.disabled;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: { code: 'validation_error', message: 'No fields to update' } }, 400);
  }

  const [updated] = await typedTx
    .update(endpoints)
    .set(updates)
    .where(eq(endpoints.id, existing.id))
    .returning();

  return c.json({
    data: {
      ...updated,
      signingSecret: maskSecret(updated.signingSecret),
    },
  });
});

// ─── DELETE (soft) ──────────────────────────────────────────────────────────

/**
 * DELETE /:appId/endpoint/:epId — Soft-delete an endpoint
 * Sets disabled=true with disabledReason='deleted'.
 */
endpointRoutes.delete('/:appId/endpoint/:epId', async (c) => {
  const appId = c.req.param('appId');
  const epId = c.req.param('epId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const typedTx = tx as typeof import('@emithq/core').db;
  const [deleted] = await typedTx
    .update(endpoints)
    .set({ disabled: true, disabledReason: 'deleted' })
    .where(
      and(
        eq(endpoints.appId, app.id),
        or(eq(endpoints.id, epId), eq(endpoints.uid, epId)),
        or(isNull(endpoints.disabledReason), ne(endpoints.disabledReason, 'deleted')),
      ),
    )
    .returning({ id: endpoints.id });

  if (!deleted) {
    return c.json({ error: { code: 'not_found', message: 'Endpoint not found' } }, 404);
  }

  return c.json({ data: { id: deleted.id, deleted: true } });
});

// ─── TEST DELIVERY ──────────────────────────────────────────────────────────

/**
 * POST /:appId/endpoint/:epId/test — Send a test webhook to verify connectivity
 * Does NOT create a delivery_attempt row.
 */
endpointRoutes.post('/:appId/endpoint/:epId/test', async (c) => {
  const appId = c.req.param('appId');
  const epId = c.req.param('epId');
  const tx = c.get('tx');

  const app = await resolveApp(tx, appId);
  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  const typedTx = tx as typeof import('@emithq/core').db;
  const [ep] = await typedTx
    .select({
      id: endpoints.id,
      url: endpoints.url,
      signingSecret: endpoints.signingSecret,
    })
    .from(endpoints)
    .where(and(eq(endpoints.appId, app.id), or(eq(endpoints.id, epId), eq(endpoints.uid, epId))))
    .limit(1);

  if (!ep) {
    return c.json({ error: { code: 'not_found', message: 'Endpoint not found' } }, 404);
  }

  const testPayload = JSON.stringify({
    type: 'webhook.test',
    data: { message: 'This is a test webhook from EmitHQ' },
    timestamp: new Date().toISOString(),
  });

  const testMsgId = `test_${crypto.randomUUID()}`;
  const headers = buildWebhookHeaders(testMsgId, testPayload, ep.signingSecret);
  const result = await deliverWebhook(ep.url, testPayload, headers);

  return c.json({ data: result });
});
