import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { adminDb, organizations } from '@emithq/core';
import type { AuthEnv } from '../types';

const TIER_LIMITS: Record<string, number> = {
  free: 100_000,
  starter: 500_000,
  growth: 2_000_000,
  scale: 10_000_000,
};

/**
 * Monthly quota enforcement middleware.
 * Checks the org's event_count_month against their tier limit.
 * Must run AFTER requireAuth (which sets orgId on context).
 */
export const quotaCheck = createMiddleware<AuthEnv>(async (c, next) => {
  const orgId = c.get('orgId');

  // Load current org to get tier and event count
  // Uses adminDb because organizations table has no RLS
  const [org] = await adminDb
    .select({
      tier: organizations.tier,
      eventCountMonth: organizations.eventCountMonth,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
  const currentCount = org.eventCountMonth ?? 0;

  if (currentCount >= limit) {
    return c.json(
      {
        error: {
          code: 'quota_exceeded',
          message: `Monthly event limit of ${limit.toLocaleString()} reached. Upgrade your plan to continue.`,
        },
      },
      429,
    );
  }

  await next();
});
