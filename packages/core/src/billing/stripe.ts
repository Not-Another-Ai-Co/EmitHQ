import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Maps tier names to Stripe price IDs (from env vars)
export type BillingInterval = 'monthly' | 'annual';
export type PaidTier = 'starter' | 'growth' | 'scale';

export interface PriceIds {
  monthly: string;
  annual: string;
}

export function getPriceIds(tier: PaidTier): PriceIds {
  const key = tier.toUpperCase();
  const monthly = process.env[`STRIPE_PRICE_${key}_MONTHLY`];
  const annual = process.env[`STRIPE_PRICE_${key}_ANNUAL`];
  if (!monthly || !annual) {
    throw new Error(`Missing STRIPE_PRICE_${key}_MONTHLY or STRIPE_PRICE_${key}_ANNUAL env vars`);
  }
  return { monthly, annual };
}

// Reverse lookup: price ID → tier
export function tierFromPriceId(priceId: string): PaidTier | null {
  const tiers: PaidTier[] = ['starter', 'growth', 'scale'];
  for (const tier of tiers) {
    try {
      const ids = getPriceIds(tier);
      if (ids.monthly === priceId || ids.annual === priceId) return tier;
    } catch {
      // env var not set — skip
    }
  }
  return null;
}

// Tier event limits (matches quota middleware)
export const TIER_LIMITS: Record<string, number> = {
  free: 100_000,
  starter: 500_000,
  growth: 2_000_000,
  scale: 10_000_000,
};
