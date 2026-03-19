import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerk } from './middleware/auth';
import { quotaHeaders } from './middleware/quota';
import { signupRoutes } from './routes/signup';
import { apiKeyRoutes } from './routes/api-keys';
import { applicationRoutes } from './routes/applications';
import { messageRoutes } from './routes/messages';
import { replayRoutes } from './routes/replay';
import { endpointRoutes } from './routes/endpoints';
import { transformPreviewRoutes } from './routes/transform-preview';
import { dashboardRoutes } from './routes/dashboard';
import { billingRoutes } from './routes/billing';
import { onboardingRoutes } from './routes/onboarding';
import { metricsRoutes } from './routes/metrics';
import { adminDb, createRedisConnection } from '@emithq/core';
import { sql } from 'drizzle-orm';

const app = new Hono();

// CORS — allow dashboard and landing page origins
app.use(
  '*',
  cors({
    origin: [
      'https://emithq.com',
      'https://www.emithq.com',
      'https://app.emithq.com',
      'http://100.82.36.13:4002', // local dev (Tailscale)
      'http://100.82.36.13:4003',
      'http://localhost:4002',
      'http://localhost:4003',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: [
      'X-EmitHQ-Quota-Limit',
      'X-EmitHQ-Quota-Used',
      'X-EmitHQ-Quota-Remaining',
      'X-EmitHQ-Quota-Reset',
      'X-EmitHQ-Tier',
      'X-EmitHQ-Quota-Warning',
      'X-EmitHQ-Upgrade-URL',
    ],
    credentials: true,
    maxAge: 86400,
  }),
);

// Singleton Redis connection for health checks — avoids creating a new connection per probe
let healthRedis: ReturnType<typeof createRedisConnection> | null = null;

// Health check (no auth) — probes DB and Redis connectivity
app.get('/health', async (c) => {
  let dbOk = false;
  let redisOk = false;

  try {
    await adminDb.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {
    /* DB unreachable */
  }

  try {
    if (!healthRedis) {
      healthRedis = createRedisConnection();
    }
    await healthRedis.ping();
    redisOk = true;
  } catch {
    // Connection may be stale — reset so next probe creates a fresh one
    healthRedis = null;
  }

  const status = dbOk && redisOk ? 'ok' : 'degraded';
  return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
});

// Metrics endpoint (secret-protected, before Clerk middleware)
app.route('/metrics', metricsRoutes);

// Public signup endpoint (before Clerk middleware — no auth required)
app.route('/api/v1/signup', signupRoutes);

// Mount Clerk middleware globally for session token support
app.use('*', clerk);

// Quota headers on all authenticated API responses
app.use('/api/v1/*', quotaHeaders);

// API routes
app.route('/api/v1/auth/keys', apiKeyRoutes);
app.route('/api/v1/app', applicationRoutes);
app.route('/api/v1/app', messageRoutes);
app.route('/api/v1/app', replayRoutes);
app.route('/api/v1/app', endpointRoutes);
app.route('/api/v1/transform', transformPreviewRoutes);
app.route('/api/v1/app', dashboardRoutes);
app.route('/api/v1/billing', billingRoutes);
app.route('/api/v1/onboarding', onboardingRoutes);

export { app };
export type { AuthEnv } from './types';
