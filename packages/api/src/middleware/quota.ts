import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { adminDb, organizations, TIER_LIMITS, TIER_PRICES } from '@emithq/core';
import type { AuthEnv } from '../types';

/** Compute the ISO 8601 UTC reset date for quota display. */
export function getQuotaResetDate(currentPeriodEnd: Date | null): string {
  if (currentPeriodEnd) {
    return currentPeriodEnd.toISOString();
  }
  // Free tier: first day of next calendar month (UTC)
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return reset.toISOString();
}

/** Build the upgrade tiers array for 429 response bodies. */
function buildUpgradeTiers() {
  return Object.entries(TIER_PRICES).map(([name, price]) => ({
    name,
    price,
    limit: TIER_LIMITS[name] ?? 0,
  }));
}

/**
 * Quota headers middleware — sets X-EmitHQ-Quota-* headers on all authenticated responses.
 * Must run AFTER requireAuth (which sets orgId on context).
 * Does NOT block — only reads and sets headers.
 */
export const quotaHeaders = createMiddleware<AuthEnv>(async (c, next) => {
  // Run the route handler first — requireAuth sets orgId during request processing
  await next();

  // Now read orgId (set by requireAuth in the route's middleware chain)
  const orgId = c.get('orgId');
  if (!orgId) return;

  try {
    const [org] = await adminDb
      .select({
        tier: organizations.tier,
        eventCountMonth: organizations.eventCountMonth,
        currentPeriodEnd: organizations.currentPeriodEnd,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) return;

    const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
    const used = org.eventCountMonth ?? 0;
    const remaining = Math.max(0, limit - used);
    const resetAt = getQuotaResetDate(org.currentPeriodEnd ?? null);
    const pct = limit > 0 ? (used / limit) * 100 : 0;

    // Set headers on the response (after route handler has produced it)
    c.header('X-EmitHQ-Quota-Limit', String(limit));
    c.header('X-EmitHQ-Quota-Used', String(used));
    c.header('X-EmitHQ-Quota-Remaining', String(remaining));
    c.header('X-EmitHQ-Quota-Reset', resetAt);
    c.header('X-EmitHQ-Tier', org.tier);

    if (pct >= 95) {
      c.header('X-EmitHQ-Quota-Warning', 'critical_limit');
      c.header('X-EmitHQ-Upgrade-URL', '/api/v1/billing/checkout');
    } else if (pct >= 80) {
      c.header('X-EmitHQ-Quota-Warning', 'approaching_limit');
      c.header('X-EmitHQ-Upgrade-URL', '/api/v1/billing/checkout');
    }
  } catch (err) {
    // Quota headers are best-effort — never crash the response
    console.error('Quota headers error:', err instanceof Error ? err.message : err);
  }
});

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
      currentPeriodEnd: organizations.currentPeriodEnd,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
  const currentCount = org.eventCountMonth ?? 0;

  // Free tier: hard limit (must upgrade)
  // Paid tiers: allow overage (billed via Stripe usage metering)
  if (currentCount >= limit && org.tier === 'free') {
    const resetAt = getQuotaResetDate(org.currentPeriodEnd ?? null);

    // Set quota headers on 429 too
    c.header('X-EmitHQ-Quota-Limit', String(limit));
    c.header('X-EmitHQ-Quota-Used', String(currentCount));
    c.header('X-EmitHQ-Quota-Remaining', '0');
    c.header('X-EmitHQ-Quota-Reset', resetAt);
    c.header('X-EmitHQ-Tier', org.tier);

    return c.json(
      {
        error: {
          code: 'quota_exceeded',
          message: 'Monthly event limit reached.',
          quota: {
            limit,
            used: currentCount,
            reset_at: resetAt,
            tier: org.tier,
          },
          action: {
            type: 'upgrade',
            url: '/api/v1/billing/checkout',
            tiers: buildUpgradeTiers(),
          },
        },
      },
      429,
    );
  }

  await next();
});
