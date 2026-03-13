import { createMiddleware } from 'hono/factory';
import { withTenant } from '@emithq/core';
import type { AuthEnv } from '../types';

/**
 * Tenant isolation middleware.
 * Wraps the downstream handler in a database transaction with SET LOCAL app.current_tenant.
 * Must run AFTER requireAuth (which sets orgId on context).
 */
export const tenantScope = createMiddleware<AuthEnv>(async (c, next) => {
  const orgId = c.get('orgId');

  if (!orgId) {
    return c.json({ error: { code: 'server_error', message: 'Tenant context not set' } }, 500);
  }

  await withTenant(orgId, async (tx) => {
    c.set('tx', tx);
    await next();
  });
});
