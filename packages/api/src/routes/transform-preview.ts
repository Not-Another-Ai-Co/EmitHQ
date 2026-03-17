import { Hono } from 'hono';
import { previewTransformation, TransformValidationError } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import type { AuthEnv } from '../types';

export const transformPreviewRoutes = new Hono<AuthEnv>();

transformPreviewRoutes.use('*', requireAuth);

/**
 * POST /api/v1/transform/preview — Preview a transformation
 * Accepts a sample payload and transformation rules, returns the before/after result.
 * Does NOT persist anything — purely stateless.
 */
transformPreviewRoutes.post('/preview', async (c) => {
  const body = await c.req.json<{
    payload: unknown;
    rules: unknown[];
  }>();

  if (body.payload === undefined || body.payload === null) {
    return c.json({ error: { code: 'validation_error', message: 'payload is required' } }, 400);
  }

  if (!body.rules || !Array.isArray(body.rules)) {
    return c.json({ error: { code: 'validation_error', message: 'rules must be an array' } }, 400);
  }

  try {
    const result = previewTransformation(
      body.payload,
      body.rules as import('@emithq/core').TransformRule[],
    );
    return c.json({ data: result });
  } catch (err) {
    if (err instanceof TransformValidationError) {
      return c.json({ error: { code: 'validation_error', message: err.message } }, 400);
    }
    throw err;
  }
});
