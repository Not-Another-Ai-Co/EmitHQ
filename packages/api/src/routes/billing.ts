import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  adminDb,
  organizations,
  billingEvents,
  getStripe,
  getPriceIds,
  tierFromPriceId,
  TIER_LIMITS,
} from '@emithq/core';
import type { PaidTier, BillingInterval } from '@emithq/core';
import { requireAuth, requireRole } from '../middleware/auth';
import type { AuthEnv } from '../types';

export const billingRoutes = new Hono<AuthEnv>();

// ─── POST /checkout — Create Stripe Checkout Session ─────────────────────────

billingRoutes.post('/checkout', requireAuth, requireRole('org:admin', 'org:owner'), async (c) => {
  const orgId = c.get('orgId');

  const body = await c.req.json<{ tier: string; interval?: string }>();

  const tier = body.tier as PaidTier;
  if (!['starter', 'growth', 'scale'].includes(tier)) {
    return c.json(
      { error: { code: 'validation_error', message: 'tier must be starter, growth, or scale' } },
      400,
    );
  }

  const interval: BillingInterval = body.interval === 'annual' ? 'annual' : 'monthly';

  // Load org to check existing subscription
  const [org] = await adminDb
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  if (org.subscriptionStatus === 'active') {
    return c.json(
      {
        error: {
          code: 'conflict',
          message: 'Active subscription exists. Use the billing portal to change plans.',
        },
      },
      409,
    );
  }

  const stripe = getStripe();
  const priceIds = getPriceIds(tier);
  const priceId = priceIds[interval];

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { org_id: orgId, tier, interval },
    subscription_data: { metadata: { org_id: orgId } },
    success_url: `${process.env.DASHBOARD_URL || 'http://localhost:4002'}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DASHBOARD_URL || 'http://localhost:4002'}/billing`,
  };

  // Reuse existing Stripe customer if we have one
  if (org.stripeCustomerId) {
    sessionParams.customer = org.stripeCustomerId;
  } else {
    sessionParams.customer_email = undefined; // Clerk doesn't expose email here; Stripe will collect it
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe checkout failed';
    return c.json({ error: { code: 'payment_error', message } }, 502);
  }

  return c.json({ data: { url: session.url } });
});

// ─── GET /subscription — Current plan and usage ─────────────────────────────

billingRoutes.get('/subscription', requireAuth, async (c) => {
  const orgId = c.get('orgId');

  const [org] = await adminDb
    .select({
      tier: organizations.tier,
      eventCountMonth: organizations.eventCountMonth,
      subscriptionStatus: organizations.subscriptionStatus,
      currentPeriodEnd: organizations.currentPeriodEnd,
      stripeCustomerId: organizations.stripeCustomerId,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return c.json({ error: { code: 'not_found', message: 'Organization not found' } }, 404);
  }

  const limit = TIER_LIMITS[org.tier] ?? TIER_LIMITS.free;
  const usage = org.eventCountMonth ?? 0;

  return c.json({
    data: {
      tier: org.tier,
      subscriptionStatus: org.subscriptionStatus,
      currentPeriodEnd: org.currentPeriodEnd,
      usage: {
        current: usage,
        limit,
        percentage: Math.round((usage / limit) * 100),
      },
      hasStripeCustomer: !!org.stripeCustomerId,
      hasSubscription: !!org.stripeSubscriptionId,
    },
  });
});

// ─── POST /portal — Create Stripe Customer Portal session ───────────────────

billingRoutes.post('/portal', requireAuth, requireRole('org:admin', 'org:owner'), async (c) => {
  const orgId = c.get('orgId');

  const [org] = await adminDb
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org?.stripeCustomerId) {
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

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.DASHBOARD_URL || 'http://localhost:4002'}/billing`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe portal failed';
    return c.json({ error: { code: 'payment_error', message } }, 502);
  }

  return c.json({ data: { url: session.url } });
});

// ─── POST /webhook — Stripe webhook handler ─────────────────────────────────
// No auth middleware — Stripe authenticates via signature verification.

billingRoutes.post('/webhook', async (c) => {
  const stripe = getStripe();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json(
      { error: { code: 'unauthorized', message: 'Missing stripe-signature header' } },
      401,
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return c.json(
      { error: { code: 'server_error', message: 'Webhook secret not configured' } },
      500,
    );
  }

  // Read raw body for signature verification — must not be JSON-parsed
  const rawBody = await c.req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return c.json({ error: { code: 'unauthorized', message: 'Invalid webhook signature' } }, 401);
  }

  // Idempotency check — skip if we've already processed this event
  // orgId is nullable here; updated after processing when we know the org
  try {
    await adminDb.insert(billingEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      payload: event.data.object as Record<string, unknown>,
    });
  } catch (err: unknown) {
    // Unique constraint violation = already processed
    if (err instanceof Error && err.message.includes('unique')) {
      return c.json({ received: true });
    }
    throw err;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  // Update billing_events with the actual org_id now that we've processed it
  const orgId = extractOrgId(event);
  if (orgId) {
    await adminDb
      .update(billingEvents)
      .set({ orgId })
      .where(eq(billingEvents.stripeEventId, event.id))
      .catch(() => {}); // best-effort
  }

  return c.json({ received: true });
});

// ─── Webhook event handlers ─────────────────────────────────────────────────

async function handleCheckoutComplete(session: Record<string, unknown>) {
  const orgId = (session.metadata as Record<string, string>)?.org_id;
  if (!orgId) return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Fetch subscription to get the price → tier mapping
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;

  await adminDb
    .update(organizations)
    .set({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      tier: tier ?? 'starter',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(organizations.id, orgId));
}

async function handleSubscriptionUpdated(subscription: Record<string, unknown>) {
  const sub = subscription as unknown as {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
    items: { data: Array<{ price: { id: string } }> };
    metadata?: Record<string, string>;
  };

  const orgId = sub.metadata?.org_id;
  if (!orgId) {
    // Try to find org by subscription ID
    const [org] = await adminDb
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.stripeSubscriptionId, sub.id))
      .limit(1);
    if (!org) return;
    await updateOrgFromSubscription(org.id, sub);
    return;
  }

  await updateOrgFromSubscription(orgId, sub);
}

async function updateOrgFromSubscription(
  orgId: string,
  sub: {
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
    items: { data: Array<{ price: { id: string } }> };
  },
) {
  const priceId = sub.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;

  const status = sub.cancel_at_period_end
    ? 'canceled'
    : sub.status === 'active'
      ? 'active'
      : sub.status === 'past_due'
        ? 'past_due'
        : sub.status;

  const updates: Record<string, unknown> = {
    subscriptionStatus: status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
  };

  if (tier) updates.tier = tier;

  await adminDb.update(organizations).set(updates).where(eq(organizations.id, orgId));
}

async function handleSubscriptionDeleted(subscription: Record<string, unknown>) {
  const sub = subscription as unknown as { id: string; metadata?: Record<string, string> };

  let orgId = sub.metadata?.org_id;
  if (!orgId) {
    const [org] = await adminDb
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.stripeSubscriptionId, sub.id))
      .limit(1);
    orgId = org?.id;
  }

  if (!orgId) return;

  await adminDb
    .update(organizations)
    .set({
      tier: 'free',
      subscriptionStatus: 'free',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    })
    .where(eq(organizations.id, orgId));
}

async function handleInvoicePaid(invoice: Record<string, unknown>) {
  const inv = invoice as unknown as {
    subscription: string | null;
    billing_reason: string;
  };

  if (!inv.subscription) return;

  // Find org by subscription ID
  const [org] = await adminDb
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeSubscriptionId, inv.subscription))
    .limit(1);

  if (!org) return;

  // Reset monthly event count on successful payment (new billing period)
  await adminDb
    .update(organizations)
    .set({
      eventCountMonth: 0,
      subscriptionStatus: 'active',
    })
    .where(eq(organizations.id, org.id));
}

async function handlePaymentFailed(invoice: Record<string, unknown>) {
  const inv = invoice as unknown as { subscription: string | null };
  if (!inv.subscription) return;

  const [org] = await adminDb
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeSubscriptionId, inv.subscription))
    .limit(1);

  if (!org) return;

  await adminDb
    .update(organizations)
    .set({ subscriptionStatus: 'past_due' })
    .where(eq(organizations.id, org.id));
}

// Extract org_id from various event types
function extractOrgId(event: { type: string; data: { object: unknown } }): string | null {
  const obj = event.data.object as Record<string, unknown>;

  // Try metadata first
  const metadata = obj.metadata as Record<string, string> | undefined;
  if (metadata?.org_id) return metadata.org_id;

  return null;
}
