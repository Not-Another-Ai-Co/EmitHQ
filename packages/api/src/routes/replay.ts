import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { replayDelivery, replayMessage, reEnableEndpoint } from '@emithq/core';
import { deliveryAttempts, messages } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import type { AuthEnv } from '../types';

export const replayRoutes = new Hono<AuthEnv>();

replayRoutes.use('*', requireAuth, tenantScope);

/**
 * POST /api/v1/app/:appId/msg/:msgId/retry — Retry all failed/exhausted deliveries for a message
 */
replayRoutes.post('/:appId/msg/:msgId/retry', async (c) => {
  const msgId = c.req.param('msgId');
  const tx = c.get('tx');

  // Verify message exists within tenant scope
  const [msg] = await tx
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.id, msgId))
    .limit(1);

  if (!msg) {
    return c.json({ error: { code: 'not_found', message: 'Message not found' } }, 404);
  }

  const results = await replayMessage(msgId);

  if (results.length === 0) {
    return c.json(
      {
        error: {
          code: 'no_retryable',
          message: 'No failed or exhausted delivery attempts to retry',
        },
      },
      400,
    );
  }

  return c.json({ data: { replayed: results.length, attempts: results } }, 200);
});

/**
 * POST /api/v1/app/:appId/msg/:msgId/attempt/:attemptId/retry — Retry a single delivery attempt
 */
replayRoutes.post('/:appId/msg/:msgId/attempt/:attemptId/retry', async (c) => {
  const attemptId = c.req.param('attemptId');
  const tx = c.get('tx');

  // Verify attempt exists within tenant scope
  const [attempt] = await tx
    .select({ id: deliveryAttempts.id })
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    return c.json({ error: { code: 'not_found', message: 'Delivery attempt not found' } }, 404);
  }

  try {
    const jobId = await replayDelivery(attemptId);
    return c.json({ data: { attemptId, jobId } }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Replay failed';
    return c.json({ error: { code: 'replay_error', message } }, 400);
  }
});
