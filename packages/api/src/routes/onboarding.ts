import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { adminDb, organizations } from '@emithq/core';
import { requireAuth } from '../middleware/auth';
import type { AuthEnv } from '../types';

export const onboardingRoutes = new Hono<AuthEnv>();

onboardingRoutes.use('*', requireAuth);

/**
 * GET /api/v1/onboarding/status — Check onboarding dismiss state
 */
onboardingRoutes.get('/status', async (c) => {
  const orgId = c.get('orgId');

  const [org] = await adminDb
    .select({ onboardingCompletedAt: organizations.onboardingCompletedAt })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  return c.json({
    data: {
      dismissed: !!org.onboardingCompletedAt,
      onboardingCompletedAt: org.onboardingCompletedAt?.toISOString() ?? null,
    },
  });
});

/**
 * POST /api/v1/onboarding/dismiss — Mark onboarding as complete
 */
onboardingRoutes.post('/dismiss', async (c) => {
  const orgId = c.get('orgId');

  const [updated] = await adminDb
    .update(organizations)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(organizations.id, orgId))
    .returning({ onboardingCompletedAt: organizations.onboardingCompletedAt });

  if (!updated) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  return c.json({
    data: {
      dismissed: true,
      onboardingCompletedAt: updated.onboardingCompletedAt?.toISOString() ?? null,
    },
  });
});
