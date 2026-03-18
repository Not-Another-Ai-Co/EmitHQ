import { Hono } from 'hono';
import { eq, isNull, and, or, gt } from 'drizzle-orm';
import { generateApiKey, apiKeys, trackEvent } from '@emithq/core';
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

  trackEvent('api_key.created', orgId);

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

/**
 * POST /api/v1/auth/keys/:keyId/rotate — Rotate an API key
 * Creates a new key and sets expiresAt on the old key (grace period).
 * Default grace period: 1 hour. Max: 24 hours.
 */
apiKeyRoutes.post('/:keyId/rotate', requireRole('org:admin', 'org:owner'), async (c) => {
  const keyId = c.req.param('keyId');
  const orgId = c.get('orgId');
  const tx = c.get('tx');

  let gracePeriodMs = 60 * 60 * 1000; // default 1 hour

  try {
    const body = await c.req.json<{ gracePeriodMinutes?: number }>();
    if (body.gracePeriodMinutes !== undefined) {
      if (
        typeof body.gracePeriodMinutes !== 'number' ||
        body.gracePeriodMinutes < 0 ||
        body.gracePeriodMinutes > 1440
      ) {
        return c.json(
          {
            error: {
              code: 'validation_error',
              message: 'gracePeriodMinutes must be 0-1440 (0-24 hours)',
            },
          },
          400,
        );
      }
      gracePeriodMs = body.gracePeriodMinutes * 60 * 1000;
    }
  } catch {
    // No body or invalid JSON — use defaults
  }

  // Verify the old key exists and is active
  const now = new Date();
  const [oldKey] = await tx
    .select({ id: apiKeys.id, name: apiKeys.name })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.orgId, orgId),
        isNull(apiKeys.revokedAt),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now)),
      ),
    )
    .limit(1);

  if (!oldKey) {
    return c.json(
      { error: { code: 'not_found', message: 'API key not found or already revoked' } },
      404,
    );
  }

  // Generate new key
  const { key, hash } = generateApiKey();

  // Create new key
  const [newKey] = await tx
    .insert(apiKeys)
    .values({
      orgId,
      keyHash: hash,
      name: oldKey.name,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

  // Set grace period expiry on old key (don't revoke immediately)
  const expiresAt = gracePeriodMs > 0 ? new Date(now.getTime() + gracePeriodMs) : now;
  await tx
    .update(apiKeys)
    .set(gracePeriodMs > 0 ? { expiresAt } : { revokedAt: now })
    .where(eq(apiKeys.id, keyId));

  trackEvent('api_key.rotated', orgId);

  return c.json(
    {
      data: {
        id: newKey.id,
        key, // New plaintext key — shown once
        name: newKey.name,
        createdAt: newKey.createdAt,
        rotatedFrom: keyId,
        oldKeyExpiresAt: gracePeriodMs > 0 ? expiresAt.toISOString() : null,
      },
    },
    201,
  );
});
