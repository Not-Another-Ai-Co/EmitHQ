import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { AuthEnv } from '../types';

export interface TestAuthContext {
  orgId?: string;
  userId?: string | null;
  authType?: 'api_key' | 'clerk_session';
}

const DEFAULT_AUTH: Required<TestAuthContext> = {
  orgId: 'test-org-id',
  userId: 'test-user-id',
  authType: 'api_key',
};

/**
 * Create a test Hono app that mounts a real route handler with mock auth context.
 *
 * Instead of re-implementing route logic in tests, this mounts the actual
 * exported route handler and injects auth context that would normally
 * come from the auth + tenant middleware chain.
 *
 * Usage:
 *   const app = createTestApp(billingRoutes, '/api/v1/billing');
 *   const res = await app.request('/api/v1/billing/subscription');
 */
export function createTestApp(
  routes: Hono<AuthEnv>,
  basePath: string,
  auth: TestAuthContext = {},
): Hono {
  const app = new Hono();
  const merged = { ...DEFAULT_AUTH, ...auth };

  // Inject mock auth context — replaces requireAuth + tenantScope middleware
  const mockAuth = createMiddleware<AuthEnv>(async (c, next) => {
    c.set('orgId', merged.orgId);
    c.set('userId', merged.userId);
    c.set('authType', merged.authType);
    await next();
  });

  app.use(`${basePath}/*`, mockAuth);
  app.route(basePath, routes);

  return app;
}

/**
 * Create a JSON request helper for cleaner test syntax.
 */
export function jsonRequest(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Request {
  const { method = 'GET', body, headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(`http://localhost${path}`, init);
}
