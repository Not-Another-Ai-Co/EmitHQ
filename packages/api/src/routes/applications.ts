import { Hono } from 'hono';
import { eq, or, and, inArray } from 'drizzle-orm';
import { applications, endpoints, messages, deliveryAttempts } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import type { AuthEnv } from '../types';

export const applicationRoutes = new Hono<AuthEnv>();

applicationRoutes.use('*', requireAuth, tenantScope);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
 */
applicationRoutes.get('/', async (c) => {
  const tx = c.get('tx');

  const apps = await tx
    .select({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
    })
    .from(applications);

  return c.json({ data: apps });
});

/**
 * GET /api/v1/app/:appId — Get application
 */
applicationRoutes.get('/:appId', async (c) => {
  const appId = c.req.param('appId');
  const tx = c.get('tx');

  const condition = UUID_RE.test(appId)
    ? or(eq(applications.id, appId), eq(applications.uid, appId))
    : eq(applications.uid, appId);

  const [app] = await tx
    .select({
      id: applications.id,
      uid: applications.uid,
      name: applications.name,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .where(condition)
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  return c.json({ data: app });
});

/**
 * DELETE /api/v1/app/:appId — Delete an application
 * Cascading: deletes all endpoints and messages belonging to this app.
 * This is a hard delete — cannot be undone.
 */
applicationRoutes.delete('/:appId', async (c) => {
  const appId = c.req.param('appId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const condition = UUID_RE.test(appId)
    ? or(eq(applications.id, appId), eq(applications.uid, appId))
    : eq(applications.uid, appId);

  // Find the app first
  const [app] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(condition)
    .limit(1);

  if (!app) {
    return c.json({ error: { code: 'not_found', message: 'Application not found' } }, 404);
  }

  // Delete delivery attempts for messages in this app (FK: delivery_attempts → messages)
  const appMessages = tx
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.appId, app.id), eq(messages.orgId, orgId)));
  await tx.delete(deliveryAttempts).where(inArray(deliveryAttempts.messageId, appMessages));

  // Delete endpoints belonging to this app
  await tx.delete(endpoints).where(and(eq(endpoints.appId, app.id), eq(endpoints.orgId, orgId)));

  // Delete messages belonging to this app
  await tx.delete(messages).where(and(eq(messages.appId, app.id), eq(messages.orgId, orgId)));

  // Delete the app itself
  await tx.delete(applications).where(eq(applications.id, app.id));

  return c.json({ data: { id: app.id, deleted: true } });
});
