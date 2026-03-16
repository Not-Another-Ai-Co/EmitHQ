import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerk } from './middleware/auth';
import { apiKeyRoutes } from './routes/api-keys';
import { messageRoutes } from './routes/messages';
import { replayRoutes } from './routes/replay';
import { endpointRoutes } from './routes/endpoints';
import { transformPreviewRoutes } from './routes/transform-preview';
import { dashboardRoutes } from './routes/dashboard';
import { billingRoutes } from './routes/billing';
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
    credentials: true,
    maxAge: 86400,
  }),
);

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
    const redis = createRedisConnection();
    await redis.ping();
    await redis.quit();
    redisOk = true;
  } catch {
    /* Redis unreachable */
  }

  const status = dbOk && redisOk ? 'ok' : 'degraded';
  return c.json({ status, db: dbOk, redis: redisOk }, status === 'ok' ? 200 : 503);
});

// Metrics endpoint (secret-protected, before Clerk middleware)
app.route('/metrics', metricsRoutes);

// Mount Clerk middleware globally for session token support
app.use('*', clerk);

// API routes
app.route('/api/v1/auth/keys', apiKeyRoutes);
app.route('/api/v1/app', messageRoutes);
app.route('/api/v1/app', replayRoutes);
app.route('/api/v1/app', endpointRoutes);
app.route('/api/v1/transform', transformPreviewRoutes);
app.route('/api/v1/app', dashboardRoutes);
app.route('/api/v1/billing', billingRoutes);

export { app };
export type { AuthEnv } from './types';
