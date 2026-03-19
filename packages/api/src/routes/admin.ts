import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { adminDb, organizations } from '@emithq/core';

export const adminRoutes = new Hono();

/**
 * Admin middleware — requires ADMIN_SECRET header.
 * Same pattern as /metrics endpoint.
 */
adminRoutes.use('*', async (c, next) => {
  const secret = process.env.ADMIN_SECRET ?? process.env.METRICS_SECRET;
  if (!secret) {
    return c.json({ error: { code: 'server_error', message: 'Admin secret not configured' } }, 500);
  }

  const provided = c.req.header('x-admin-secret') ?? c.req.header('x-metrics-secret');
  if (provided !== secret) {
    return c.json({ error: { code: 'unauthorized', message: 'Invalid admin secret' } }, 401);
  }

  await next();
});

/**
 * POST /api/v1/admin/org/:orgId/disable — Disable an organization
 * All API calls from this org will return 403.
 */
adminRoutes.post('/org/:orgId/disable', async (c) => {
  const orgId = c.req.param('orgId');
  const body = await c.req.json<{ reason?: string }>().catch(() => ({ reason: undefined }));

  const [org] = await adminDb
    .update(organizations)
    .set({
      disabled: true,
      disabledReason: body.reason ?? 'Disabled by admin',
    })
    .where(eq(organizations.id, orgId))
    .returning({ id: organizations.id, name: organizations.name });

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  return c.json({ data: { id: org.id, name: org.name, disabled: true } });
});

/**
 * POST /api/v1/admin/org/:orgId/enable — Re-enable an organization
 */
adminRoutes.post('/org/:orgId/enable', async (c) => {
  const orgId = c.req.param('orgId');

  const [org] = await adminDb
    .update(organizations)
    .set({
      disabled: false,
      disabledReason: null,
    })
    .where(eq(organizations.id, orgId))
    .returning({ id: organizations.id, name: organizations.name });

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  return c.json({ data: { id: org.id, name: org.name, disabled: false } });
});
