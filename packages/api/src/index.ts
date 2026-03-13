import { Hono } from 'hono';
import { clerk } from './middleware/auth';
import { apiKeyRoutes } from './routes/api-keys';

const app = new Hono();

// Health check (no auth)
app.get('/health', (c) => c.json({ status: 'ok' }));

// Mount Clerk middleware globally for session token support
app.use('*', clerk);

// API routes
app.route('/api/v1/auth/keys', apiKeyRoutes);

export { app };
export type { AuthEnv } from './types';
