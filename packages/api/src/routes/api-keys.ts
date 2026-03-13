import { Hono } from 'hono';
import { eq, isNull, and } from 'drizzle-orm';
import { generateApiKey, apiKeys } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import { tenantScope } from '../middleware/tenant';
import { requireRole } from '../middleware/auth';
import type { AuthEnv } from '../types';

export const apiKeyRoutes = new Hono<AuthEnv>();

// All routes require auth + tenant scope
apiKeyRoutes.use('*', requireAuth, tenantScope);

/**
 * POST /api/v1/auth/keys — Create a new API key
 * Returns the plaintext key exactly once. Only the hash is stored.
 */
apiKeyRoutes.post('/', requireRole('org:admin', 'org:owner'), async (c) => {
  const body = await c.req.json<{ name: string }>();

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return c.json({ error: { code: 'validation_error', message: 'name is required' } }, 400);
  }

  const { key, hash } = generateApiKey();
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const [created] = await tx
    .insert(apiKeys)
    .values({
      orgId,
      keyHash: hash,
      name: body.name.trim(),
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

  return c.json(
    {
      data: {
        id: created.id,
        key, // Plaintext — shown once, never again
        name: created.name,
        createdAt: created.createdAt,
      },
    },
    201,
  );
});

/**
 * GET /api/v1/auth/keys — List all active API keys for the org
 * Never returns key hashes — only metadata.
 */
apiKeyRoutes.get('/', async (c) => {
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const keys = await tx
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)));

  return c.json({ data: keys });
});

/**
 * DELETE /api/v1/auth/keys/:keyId — Revoke an API key (soft-delete)
 */
apiKeyRoutes.delete('/:keyId', requireRole('org:admin', 'org:owner'), async (c) => {
  const keyId = c.req.param('keyId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  const [revoked] = await tx
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });

  if (!revoked) {
    return c.json(
      {
        error: {
          code: 'not_found',
          message: 'API key not found or already revoked',
        },
      },
      404,
    );
  }

  return c.json({ data: { id: revoked.id, revoked: true } });
});
