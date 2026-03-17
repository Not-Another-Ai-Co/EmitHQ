/**
 * Consolidated mock for @emithq/core.
 *
 * This provides mock implementations of all DB tables (as Drizzle column references),
 * DB clients, queue functions, and utilities that routes import from core.
 *
 * Usage in test files:
 *   vi.mock('@emithq/core', () => coreMock());
 *   vi.mock('../middleware/auth', () => authMock());
 *   vi.mock('../middleware/tenant', () => tenantMock());
 */

import { vi } from 'vitest';

/** Column reference stub — used in Drizzle select/where/eq calls */
function col(name: string) {
  return { name, _: { name } };
}

/** Table stub with column references */
function table(name: string, columns: string[]) {
  const t: Record<string, unknown> = {};
  for (const c of columns) {
    t[c] = col(c);
  }
  return t;
}

export function coreMock() {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  };

  return {
    // DB clients
    db: mockDb,
    adminDb: { ...mockDb, execute: vi.fn().mockResolvedValue({ rows: [] }) },
    pool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
    adminPool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
    withTenant: vi.fn(async (_orgId: string, fn: (tx: unknown) => Promise<void>) => {
      await fn(mockDb);
    }),

    // Schema tables
    organizations: table('organizations', [
      'id',
      'clerkOrgId',
      'name',
      'slug',
      'tier',
      'eventCountMonth',
      'stripeCustomerId',
      'stripeSubscriptionId',
      'subscriptionStatus',
      'currentPeriodEnd',
      'createdAt',
    ]),
    applications: table('applications', ['id', 'orgId', 'uid', 'name', 'createdAt']),
    endpoints: table('endpoints', [
      'id',
      'appId',
      'orgId',
      'uid',
      'url',
      'description',
      'signingSecret',
      'eventTypeFilter',
      'disabled',
      'disabledReason',
      'failureCount',
      'rateLimit',
      'transformRules',
      'createdAt',
    ]),
    messages: table('messages', [
      'id',
      'appId',
      'orgId',
      'eventId',
      'eventType',
      'payload',
      'createdAt',
    ]),
    deliveryAttempts: table('delivery_attempts', [
      'id',
      'messageId',
      'endpointId',
      'orgId',
      'attemptNumber',
      'status',
      'responseStatus',
      'responseBody',
      'responseTimeMs',
      'errorMessage',
      'nextAttemptAt',
      'attemptedAt',
      'createdAt',
    ]),
    apiKeys: table('api_keys', [
      'id',
      'orgId',
      'keyHash',
      'name',
      'lastUsedAt',
      'expiresAt',
      'revokedAt',
      'createdAt',
    ]),
    billingEvents: table('billing_events', [
      'id',
      'orgId',
      'stripeEventId',
      'eventType',
      'payload',
      'processedAt',
    ]),
    analyticsEvents: table('analytics_events', [
      'id',
      'orgId',
      'eventName',
      'properties',
      'createdAt',
    ]),
    inboundSources: table('inbound_sources', [
      'id',
      'orgId',
      'provider',
      'label',
      'signingSecret',
      'endpointPath',
      'createdAt',
    ]),

    // Auth
    generateApiKey: vi.fn().mockReturnValue({ key: 'emhq_test_key', hash: 'test_hash' }),
    hashApiKey: vi.fn().mockReturnValue('test_hash'),
    verifyApiKey: vi.fn().mockReturnValue(true),
    isEmithqApiKey: vi.fn().mockReturnValue(false),

    // Queue
    getDeliveryQueue: vi.fn().mockReturnValue({
      add: vi.fn().mockResolvedValue({}),
      getJobCounts: vi
        .fn()
        .mockResolvedValue({ waiting: 0, active: 0, failed: 0, delayed: 0, completed: 0 }),
    }),
    enqueueDelivery: vi.fn().mockResolvedValue(undefined),
    createRedisConnection: vi.fn().mockReturnValue({
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue(undefined),
    }),

    // Signing
    generateSigningSecret: vi.fn().mockReturnValue('whsec_testSecret123'),
    buildWebhookHeaders: vi.fn().mockReturnValue({}),
    deliverWebhook: vi
      .fn()
      .mockResolvedValue({ success: true, statusCode: 200, responseTimeMs: 42 }),

    // Transformation
    validateTransformRules: vi.fn().mockReturnValue([]),
    TransformValidationError: class TransformValidationError extends Error {},
    previewTransformation: vi.fn(),

    // Billing
    getStripe: vi.fn().mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
        },
      },
      billingPortal: {
        sessions: { create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }) },
      },
      subscriptions: { retrieve: vi.fn(), list: vi.fn().mockResolvedValue({ data: [] }) },
      webhooks: { constructEvent: vi.fn() },
    }),
    getPriceIds: vi.fn().mockReturnValue({ monthly: 'price_test_m', annual: 'price_test_a' }),
    tierFromPriceId: vi.fn().mockReturnValue('starter'),
    TIER_LIMITS: { free: 100_000, starter: 500_000, growth: 2_000_000, scale: 10_000_000 },
    TIER_PRICES: { starter: 49, growth: 149, scale: 349 },

    // Analytics
    trackEvent: vi.fn(),

    // Queue utilities
    replayDelivery: vi.fn(),
    replayMessage: vi.fn(),

    // Workers
    startDeliveryWorker: vi.fn(),

    // Version
    VERSION: '0.1.0',
  };
}

/** Mock for ../middleware/auth — passes through without real auth */
export function authMock() {
  const passthrough = vi.fn(async (_c: unknown, next: () => Promise<void>) => next());
  return {
    clerk: passthrough,
    requireAuth: passthrough,
    requireRole: vi.fn(() => passthrough),
  };
}

/** Mock for ../middleware/tenant — passes through without real tenant scoping */
export function tenantMock() {
  return {
    tenantScope: vi.fn(async (_c: unknown, next: () => Promise<void>) => next()),
  };
}
