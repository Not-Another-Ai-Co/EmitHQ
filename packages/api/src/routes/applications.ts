import { Hono } from 'hono';
import { eq, or, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { applications, endpoints } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import type { AuthEnv } from '../types';

export const applicationRoutes = new Hono<AuthEnv>();

applicationRoutes.use('*', requireAuth, tenantScope);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function appCondition(appId: string) {
  return UUID_RE.test(appId)
    ? or(eq(applications.id, appId), eq(applications.uid, appId))
    : eq(applications.uid, appId);
}

/**
 * POST /api/v1/app — Create an application
 */
applicationRoutes.post('/', async (c) => {
  const orgId = c.get('orgId');
  const tx = c.get('tx');
  const body = await c.req.json<{ name: string; uid?: string }>();

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return c.json({ error: { code: 'validation_error', message: 'name is required' } }, 400);
  }

  if (body.uid !== undefined) {
    if (typeof body.uid !== 'string' || body.uid.trim() === '') {
      return c.json(
        { error: { code: 'validation_error', message: 'uid must be a non-empty string' } },
        400,
      );
    }
  }

  const [created] = await tx
    .insert(applications)
    .values({
      orgId,
      name: body.name.trim(),
      uid: body.uid?.trim() ?? null,
    })
    .returning({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
    });

  return c.json({ data: created }, 201);
});

/**
 * GET /api/v1/app — List applications
 * ?deleted=true returns only soft-deleted apps (for Danger Zone)
 */
applicationRoutes.get('/', async (c) => {
  const tx = c.get('tx');
  const showDeleted = c.req.query('deleted') === 'true';

  if (showDeleted) {
    const deleted = await tx
      .select({
        id: applications.id,
        uid: applications.uid,
        name: applications.name,
        deletedAt: applications.deletedAt,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .where(isNotNull(applications.deletedAt));

    return c.json({ data: deleted });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const apps = await tx
    .select({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
      endpointCount: sql<number>`(
        select count(*)::int from endpoints e
        where e.app_id = ${applications.id}
          and e.disabled = false
          and (e.disabled_reason is null or e.disabled_reason != 'deleted')
      )`,
      events24h: sql<number>`(
        select count(*)::int from messages m
        where m.app_id = ${applications.id}
          and m.created_at >= ${oneDayAgo}
      )`,
    })
    .from(applications)
    .where(isNull(applications.deletedAt));

  return c.json({ data: apps });
});

/**
 * GET /api/v1/app/:appId — Get application (excludes soft-deleted)
 */
applicationRoutes.get('/:appId', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const [app] = await tx
    .select({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .where(and(appCondition(appId), isNull(applications.deletedAt)))
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  return c.json({ data: app });
});

/**
 * DELETE /api/v1/app/:appId — Soft-delete an application
 * Sets deleted_at timestamp and disables all endpoints.
 * Recoverable within 30 days via POST /api/v1/app/:appId/restore.
 */
applicationRoutes.delete('/:appId', async (c) => {
  const appId = c.req.param('appId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const [app] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(and(appCondition(appId), isNull(applications.deletedAt)))
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  // Soft-delete the app
  await tx.update(applications).set({ deletedAt: new Date() }).where(eq(applications.id, app.id));

  // Cascade-disable all endpoints (prevents delivery worker from sending)
  await tx
    .update(endpoints)
    .set({ disabled: true, disabledReason: 'app_deleted' })
    .where(and(eq(endpoints.appId, app.id), eq(endpoints.orgId, orgId)));

  return c.json({ data: { id: app.id, deleted: true } });
});

/**
 * POST /api/v1/app/:appId/restore — Restore a soft-deleted application
 * Clears deleted_at and re-enables endpoints that were disabled by the delete.
 */
applicationRoutes.post('/:appId/restore', async (c) => {
  const appId = c.req.param('appId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  // Find the soft-deleted app
  const [app] = await tx
    .select({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
    })
    .from(applications)
    .where(and(appCondition(appId), isNotNull(applications.deletedAt)))
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Deleted application not found' } }, 404);
  }

  // Restore the app
  const [restored] = await tx
    .update(applications)
    .set({ deletedAt: null })
    .where(eq(applications.id, app.id))
    .returning({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
    });

  // Re-enable endpoints that were disabled by the app soft-delete
  await tx
    .update(endpoints)
    .set({ disabled: false, disabledReason: null, failureCount: 0 })
    .where(
      and(
        eq(endpoints.appId, app.id),
        eq(endpoints.orgId, orgId),
        eq(endpoints.disabledReason, 'app_deleted'),
      ),
    );

  return c.json({ data: restored });
});
