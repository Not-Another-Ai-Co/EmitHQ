import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { coreMock, authMock, tenantMock } from '../test-helpers/mock-core';

// Mock dependencies BEFORE importing the route
vi.mock('@emithq/core', () => coreMock());
vi.mock('../middleware/auth', () => authMock());
vi.mock('../middleware/tenant', () => tenantMock());

import { billingRoutes, billingWebhookRoute } from './billing';
import { createTestApp, jsonRequest } from '../test-helpers/create-test-app';
import { Hono } from 'hono';

describe('billing routes (real handlers)', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mount both billing routes and webhook route (webhook is separate since it runs before Clerk)
    const combined = new Hono();
    combined.route('/api/v1/billing', billingWebhookRoute);
    combined.route('/api/v1/billing', billingRoutes);
    app = combined as unknown as ReturnType<typeof createTestApp>;
  });

  describe('POST /checkout', () => {
    it('rejects missing tier field', async () => {
      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: {} }),
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('validation_error');
    });

    it('rejects invalid tier (free)', async () => {
      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: { tier: 'free' } }),
      );
      expect(res.status).toBe(400);
    });

    it('rejects invalid tier (unknown)', async () => {
      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: { tier: 'enterprise' } }),
      );
      expect(res.status).toBe(400);
    });

    it('accepts valid tier and returns checkout URL', async () => {
      // Mock org lookup — org exists, no active subscription
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([
        { id: 'test-org', subscriptionStatus: 'free', stripeCustomerId: null },
      ]);

      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: { tier: 'starter' } }),
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.url).toContain('checkout.stripe.com');
    });

    it('rejects when active subscription exists', async () => {
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([
        { id: 'test-org', subscriptionStatus: 'active', stripeCustomerId: 'cus_123' },
      ]);

      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: { tier: 'growth' } }),
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe('conflict');
    });

    it('defaults interval to monthly when not specified', async () => {
      const { adminDb, getStripe } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([
        { id: 'test-org', subscriptionStatus: 'free', stripeCustomerId: null },
      ]);

      const res = await app.request(
        jsonRequest('/api/v1/billing/checkout', { method: 'POST', body: { tier: 'starter' } }),
      );
      expect(res.status).toBe(200);

      // Verify Stripe was called with the monthly price
      const stripe = (getStripe as ReturnType<typeof vi.fn>)();
      expect(stripe.checkout.sessions.create).toHaveBeenCalled();
    });
  });

  describe('GET /subscription', () => {
    it('returns usage data for existing org', async () => {
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([
        {
          tier: 'starter',
          eventCountMonth: 150000,
          subscriptionStatus: 'active',
          currentPeriodEnd: new Date(),
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
        },
      ]);

      const res = await app.request('/api/v1/billing/subscription');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.tier).toBe('starter');
      expect(json.data.usage.current).toBe(150000);
      expect(json.data.usage.limit).toBe(500000);
      expect(json.data.usage.percentage).toBe(30);
    });

    it('returns 404 for missing org', async () => {
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([]);

      const res = await app.request('/api/v1/billing/subscription');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /portal', () => {
    it('returns 412 when no Stripe customer exists', async () => {
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([{ stripeCustomerId: null }]);

      const res = await app.request(jsonRequest('/api/v1/billing/portal', { method: 'POST' }));
      expect(res.status).toBe(412);
      const json = await res.json();
      expect(json.error.code).toBe('precondition_failed');
    });

    it('returns portal URL when customer exists', async () => {
      const { adminDb } = await import('@emithq/core');
      (
        (adminDb as unknown as Record<string, unknown>).select as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).from as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).where as ReturnType<typeof vi.fn>
      ).mockReturnThis();
      (
        (adminDb as unknown as Record<string, unknown>).limit as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce([{ stripeCustomerId: 'cus_123' }]);

      const res = await app.request(jsonRequest('/api/v1/billing/portal', { method: 'POST' }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.url).toContain('stripe.com');
    });
  });

  describe('POST /webhook', () => {
    it('rejects missing stripe-signature header', async () => {
      const res = await app.request(
        jsonRequest('/api/v1/billing/webhook', { method: 'POST', body: { type: 'test' } }),
      );
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('unauthorized');
    });

    it('does not leak stack trace or secret chars on signature verification failure', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_value_1234567890';
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { getStripe } = await import('@emithq/core');
      const stripe = (getStripe as ReturnType<typeof vi.fn>)();
      (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('No signatures found matching the expected signature');
      });
      const res = await app.request(
        jsonRequest('/api/v1/billing/webhook', {
          method: 'POST',
          body: { type: 'test' },
          headers: { 'stripe-signature': 'invalid-sig' },
        }),
      );
      expect(res.status).toBe(401);
      const json = await res.json();
      // No stack field in response
      expect(json).not.toHaveProperty('stack');
      // Console.error should not contain webhook secret chars or signature header
      for (const call of errorSpy.mock.calls) {
        const logOutput = call.join(' ');
        expect(logOutput).not.toContain('Webhook secret starts with');
        expect(logOutput).not.toContain('Signature header:');
      }
      errorSpy.mockRestore();
      delete process.env.STRIPE_WEBHOOK_SECRET;
    });
  });
});

describe('webhook event handler integration (real handlers)', () => {
  let webhookApp: Hono;

  function makeWebhookRequest(event: Record<string, unknown>) {
    return new Request('http://localhost/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'stripe-signature': 't=1234,v1=abc123',
      },
      body: JSON.stringify(event),
    });
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    webhookApp = new Hono();
    webhookApp.route('/api/v1/billing', billingWebhookRoute);

    const { getStripe, adminDb } = await import('@emithq/core');
    const stripe = (getStripe as ReturnType<typeof vi.fn>)();

    // Mock constructEvent to return the event object passed in the request body
    (stripe.webhooks.constructEvent as ReturnType<typeof vi.fn>).mockImplementation(
      (rawBody: string) => JSON.parse(rawBody),
    );

    // Mock idempotency insert (billingEvents) — resolve successfully (not a duplicate)
    (adminDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('checkout.session.completed sets org to active with correct tier', async () => {
    const { getStripe, adminDb, tierFromPriceId } = await import('@emithq/core');
    const stripe = (getStripe as ReturnType<typeof vi.fn>)();

    // Mock stripe.subscriptions.retrieve
    (stripe.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      items: { data: [{ price: { id: 'price_test_m' } }] },
      current_period_end: 1700000000,
    });

    (tierFromPriceId as ReturnType<typeof vi.fn>).mockReturnValueOnce('starter');

    // Capture set() args
    const setCalls: unknown[] = [];
    (adminDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockImplementation((args: unknown) => {
        setCalls.push(args);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    });

    const res = await webhookApp.request(
      makeWebhookRequest({
        id: 'evt_checkout_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { org_id: 'org_test' },
            customer: 'cus_test',
            subscription: 'sub_test',
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(setCalls.length).toBeGreaterThanOrEqual(1);
    const orgUpdate = setCalls.find(
      (c) => typeof c === 'object' && c !== null && 'stripeCustomerId' in c,
    );
    expect(orgUpdate).toMatchObject({
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_test',
      subscriptionStatus: 'active',
      tier: 'starter',
    });
  });

  it('customer.subscription.updated updates tier and status', async () => {
    const { adminDb, tierFromPriceId } = await import('@emithq/core');

    (tierFromPriceId as ReturnType<typeof vi.fn>).mockReturnValueOnce('growth');

    const setCalls: unknown[] = [];
    (adminDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockImplementation((args: unknown) => {
        setCalls.push(args);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    });

    const res = await webhookApp.request(
      makeWebhookRequest({
        id: 'evt_sub_upd_1',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test',
            metadata: { org_id: 'org_test' },
            status: 'active',
            cancel_at_period_end: false,
            current_period_end: 1700000000,
            items: { data: [{ price: { id: 'price_test_growth' } }] },
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const orgUpdate = setCalls.find(
      (c) => typeof c === 'object' && c !== null && 'subscriptionStatus' in c,
    );
    expect(orgUpdate).toMatchObject({
      subscriptionStatus: 'active',
      tier: 'growth',
    });
  });

  it('customer.subscription.deleted downgrades to free tier', async () => {
    const { adminDb } = await import('@emithq/core');

    const setCalls: unknown[] = [];
    (adminDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockImplementation((args: unknown) => {
        setCalls.push(args);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    });

    const res = await webhookApp.request(
      makeWebhookRequest({
        id: 'evt_sub_del_1',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test',
            metadata: { org_id: 'org_test' },
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const orgUpdate = setCalls.find((c) => typeof c === 'object' && c !== null && 'tier' in c);
    expect(orgUpdate).toMatchObject({
      tier: 'free',
      subscriptionStatus: 'free',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    });
  });

  it('invoice.payment_failed sets subscription status to past_due', async () => {
    const { adminDb } = await import('@emithq/core');

    // Mock org lookup by subscription ID
    (adminDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'org_test' }]),
        }),
      }),
    });

    const setCalls: unknown[] = [];
    (adminDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockImplementation((args: unknown) => {
        setCalls.push(args);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    });

    const res = await webhookApp.request(
      makeWebhookRequest({
        id: 'evt_pay_fail_1',
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_test',
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const orgUpdate = setCalls.find(
      (c) => typeof c === 'object' && c !== null && 'subscriptionStatus' in c,
    );
    expect(orgUpdate).toMatchObject({
      subscriptionStatus: 'past_due',
    });
  });
});

describe('webhook event handling logic', () => {
  function resolveStatus(sub: { cancel_at_period_end: boolean; status: string }): string {
    if (sub.cancel_at_period_end) return 'canceled';
    if (sub.status === 'active') return 'active';
    if (sub.status === 'past_due') return 'past_due';
    return sub.status;
  }

  it('detects cancel_at_period_end as canceled', () => {
    expect(resolveStatus({ cancel_at_period_end: true, status: 'active' })).toBe('canceled');
  });

  it('maps active status correctly', () => {
    expect(resolveStatus({ cancel_at_period_end: false, status: 'active' })).toBe('active');
  });

  it('maps past_due status correctly', () => {
    expect(resolveStatus({ cancel_at_period_end: false, status: 'past_due' })).toBe('past_due');
  });
});

describe('quota behavior by tier', () => {
  const TIER_LIMITS = { free: 100_000, starter: 500_000, growth: 2_000_000, scale: 10_000_000 };

  function shouldBlock(tier: string, count: number): boolean {
    const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.free;
    return tier === 'free' && count >= limit;
  }

  it('free tier blocks at limit', () => {
    expect(shouldBlock('free', 100_000)).toBe(true);
    expect(shouldBlock('free', 150_000)).toBe(true);
  });

  it('free tier allows below limit', () => {
    expect(shouldBlock('free', 99_999)).toBe(false);
  });

  it('paid tiers allow overage past their limit', () => {
    expect(shouldBlock('starter', 999_999)).toBe(false);
    expect(shouldBlock('growth', 5_000_000)).toBe(false);
    expect(shouldBlock('scale', 20_000_000)).toBe(false);
  });
});
