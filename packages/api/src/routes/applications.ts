import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import { applications } from '@emithq/core';
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
