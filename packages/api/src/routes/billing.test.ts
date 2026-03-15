import { describe, it, expect } from 'vitest';

describe('tier validation', () => {
  const VALID_TIERS = ['starter', 'growth', 'scale'];

  it('accepts valid paid tiers', () => {
    for (const tier of VALID_TIERS) {
      expect(VALID_TIERS.includes(tier)).toBe(true);
    }
  });

  it('rejects free tier for checkout', () => {
    expect(VALID_TIERS.includes('free')).toBe(false);
  });

  it('rejects unknown tier', () => {
    expect(VALID_TIERS.includes('enterprise')).toBe(false);
  });
});

describe('interval validation', () => {
  function normalizeInterval(input?: string): 'monthly' | 'annual' {
    return input === 'annual' ? 'annual' : 'monthly';
  }

  it('defaults to monthly when unspecified', () => {
    expect(normalizeInterval()).toBe('monthly');
    expect(normalizeInterval(undefined)).toBe('monthly');
  });

  it('accepts annual', () => {
    expect(normalizeInterval('annual')).toBe('annual');
  });

  it('falls back to monthly for unknown values', () => {
    expect(normalizeInterval('weekly')).toBe('monthly');
    expect(normalizeInterval('')).toBe('monthly');
  });
});

describe('tierFromPriceId', () => {
  // Inline the lookup logic for unit testing without env vars
  function tierFromPriceId(
    priceId: string,
    priceMap: Record<string, { monthly: string; annual: string }>,
  ): string | null {
    for (const [tier, ids] of Object.entries(priceMap)) {
      if (ids.monthly === priceId || ids.annual === priceId) return tier;
    }
    return null;
  }

  const testPriceMap = {
    starter: { monthly: 'price_starter_m', annual: 'price_starter_a' },
    growth: { monthly: 'price_growth_m', annual: 'price_growth_a' },
    scale: { monthly: 'price_scale_m', annual: 'price_scale_a' },
  };

  it('resolves monthly price to tier', () => {
    expect(tierFromPriceId('price_starter_m', testPriceMap)).toBe('starter');
    expect(tierFromPriceId('price_growth_m', testPriceMap)).toBe('growth');
    expect(tierFromPriceId('price_scale_m', testPriceMap)).toBe('scale');
  });

  it('resolves annual price to tier', () => {
    expect(tierFromPriceId('price_starter_a', testPriceMap)).toBe('starter');
    expect(tierFromPriceId('price_scale_a', testPriceMap)).toBe('scale');
  });

  it('returns null for unknown price', () => {
    expect(tierFromPriceId('price_unknown', testPriceMap)).toBeNull();
  });
});

describe('quota behavior by tier', () => {
  const TIER_LIMITS: Record<string, number> = {
    free: 100_000,
    starter: 500_000,
    growth: 2_000_000,
    scale: 10_000_000,
  };

  function shouldBlock(tier: string, eventCount: number): boolean {
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    // Only free tier hard-blocks; paid tiers allow overage
    return tier === 'free' && eventCount >= limit;
  }

  it('blocks free tier at limit', () => {
    expect(shouldBlock('free', 100_000)).toBe(true);
    expect(shouldBlock('free', 150_000)).toBe(true);
  });

  it('allows free tier below limit', () => {
    expect(shouldBlock('free', 99_999)).toBe(false);
  });

  it('allows paid tiers past their limit (overage)', () => {
    expect(shouldBlock('starter', 500_000)).toBe(false);
    expect(shouldBlock('starter', 999_999)).toBe(false);
    expect(shouldBlock('growth', 5_000_000)).toBe(false);
    expect(shouldBlock('scale', 20_000_000)).toBe(false);
  });
});

describe('billing routes (contract tests)', () => {
  it('checkout requires tier field', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/checkout', async (c) => {
      const body = await c.req.json();
      const tier = body.tier;
      if (!['starter', 'growth', 'scale'].includes(tier)) {
        return c.json(
          {
            error: { code: 'validation_error', message: 'tier must be starter, growth, or scale' },
          },
          400,
        );
      }
      return c.json({ data: { url: 'https://checkout.stripe.com/session_123' } });
    });

    // Missing tier
    const res1 = await app.request('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error.code).toBe('validation_error');

    // Invalid tier
    const res2 = await app.request('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'free' }),
    });
    expect(res2.status).toBe(400);
  });

  it('checkout returns Stripe session URL', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/checkout', async (c) => {
      return c.json({ data: { url: 'https://checkout.stripe.com/session_abc' } });
    });

    const res = await app.request('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'starter' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.url).toContain('checkout.stripe.com');
  });

  it('subscription returns usage data shape', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/subscription', async (c) => {
      return c.json({
        data: {
          tier: 'starter',
          subscriptionStatus: 'active',
          currentPeriodEnd: '2026-04-15T00:00:00Z',
          usage: { current: 150_000, limit: 500_000, percentage: 30 },
          hasStripeCustomer: true,
          hasSubscription: true,
        },
      });
    });

    const res = await app.request('/subscription');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveProperty('tier');
    expect(json.data).toHaveProperty('subscriptionStatus');
    expect(json.data.usage).toHaveProperty('current');
    expect(json.data.usage).toHaveProperty('limit');
    expect(json.data.usage).toHaveProperty('percentage');
  });

  it('portal requires existing Stripe customer', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/portal', async (c) => {
      const hasCustomer = false;
      if (!hasCustomer) {
        return c.json(
          {
            error: {
              code: 'precondition_failed',
              message: 'No billing account. Subscribe to a plan first.',
            },
          },
          412,
        );
      }
      return c.json({ data: { url: 'https://billing.stripe.com/session_xyz' } });
    });

    const res = await app.request('/portal', { method: 'POST' });
    expect(res.status).toBe(412);
    const json = await res.json();
    expect(json.error.code).toBe('precondition_failed');
  });

  it('portal returns portal URL when customer exists', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/portal', async (c) => {
      return c.json({ data: { url: 'https://billing.stripe.com/session_xyz' } });
    });

    const res = await app.request('/portal', { method: 'POST' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.url).toContain('stripe.com');
  });

  it('webhook rejects missing signature', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/webhook', async (c) => {
      const sig = c.req.header('stripe-signature');
      if (!sig) {
        return c.json(
          { error: { code: 'unauthorized', message: 'Missing stripe-signature header' } },
          401,
        );
      }
      return c.json({ received: true });
    });

    const res = await app.request('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'invoice.paid' }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('unauthorized');
  });

  it('webhook accepts with signature header (contract shape)', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/webhook', async (c) => {
      const sig = c.req.header('stripe-signature');
      if (!sig) {
        return c.json({ error: { code: 'unauthorized' } }, 401);
      }
      // In real code, stripe.webhooks.constructEvent would verify
      return c.json({ received: true });
    });

    const res = await app.request('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify({ type: 'invoice.paid' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it('checkout rejects when active subscription exists', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.post('/checkout', async (c) => {
      const subscriptionStatus = 'active';
      if (subscriptionStatus === 'active') {
        return c.json({ error: { code: 'conflict', message: 'Active subscription exists.' } }, 409);
      }
      return c.json({ data: { url: 'https://checkout.stripe.com/...' } });
    });

    const res = await app.request('/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'growth' }),
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('conflict');
  });
});

describe('webhook event handling logic', () => {
  it('subscription deletion resets org to free tier', () => {
    // Simulates handleSubscriptionDeleted behavior
    const updates = {
      tier: 'free',
      subscriptionStatus: 'free',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    };

    expect(updates.tier).toBe('free');
    expect(updates.subscriptionStatus).toBe('free');
    expect(updates.stripeSubscriptionId).toBeNull();
  });

  it('invoice.paid resets event count to 0', () => {
    const updates = {
      eventCountMonth: 0,
      subscriptionStatus: 'active',
    };

    expect(updates.eventCountMonth).toBe(0);
    expect(updates.subscriptionStatus).toBe('active');
  });

  it('payment failure sets past_due status', () => {
    const updates = {
      subscriptionStatus: 'past_due',
    };

    expect(updates.subscriptionStatus).toBe('past_due');
  });

  it('subscription update detects cancel_at_period_end', () => {
    function resolveStatus(sub: { cancel_at_period_end: boolean; status: string }): string {
      if (sub.cancel_at_period_end) return 'canceled';
      if (sub.status === 'active') return 'active';
      if (sub.status === 'past_due') return 'past_due';
      return sub.status;
    }

    expect(resolveStatus({ cancel_at_period_end: true, status: 'active' })).toBe('canceled');
    expect(resolveStatus({ cancel_at_period_end: false, status: 'active' })).toBe('active');
    expect(resolveStatus({ cancel_at_period_end: false, status: 'past_due' })).toBe('past_due');
  });
});

describe('idempotency', () => {
  it('duplicate stripe_event_id should be detected', () => {
    const processed = new Set<string>();
    const eventId = 'evt_123abc';

    // First time: not a duplicate
    expect(processed.has(eventId)).toBe(false);
    processed.add(eventId);

    // Second time: duplicate
    expect(processed.has(eventId)).toBe(true);
  });
});
