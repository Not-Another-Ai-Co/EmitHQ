// @emithq/core — Delivery engine, retry logic, signing, queue workers
export const VERSION = '0.1.0';

// Database
export { db, adminDb, pool, adminPool } from './db/client';
export { withTenant } from './db/tenant';
export {
  organizations,
  billingEvents,
  apiKeys,
  applications,
  endpoints,
  messages,
  deliveryAttempts,
  inboundSources,
  analyticsEvents,
} from './db/schema';
export type * from './db/types';

// Auth
export { generateApiKey, hashApiKey, verifyApiKey, isEmithqApiKey } from './auth/api-key';
export type { GeneratedKey } from './auth/api-key';

// Queue
export { getDeliveryQueue, enqueueDelivery } from './queue/delivery-queue';
export { createRedisConnection } from './queue/redis';
export { replayDelivery, replayMessage } from './queue/replay';
export type { DeliveryJobData } from './queue/delivery-queue';

// Signing
export { buildWebhookHeaders, generateSigningSecret } from './signing/webhook-signer';

// Transformation
export {
  previewTransformation,
  validateTransformRules,
  TransformValidationError,
} from './transformation/transform';
export type { TransformRule } from './transformation/transform';

// Analytics
export { trackEvent } from './analytics/track';
export type { AnalyticsEventName } from './analytics/track';

// Billing
export {
  getStripe,
  getPriceIds,
  tierFromPriceId,
  TIER_LIMITS,
  TIER_PRICES,
} from './billing/stripe';
export type { BillingInterval, PaidTier, PriceIds } from './billing/stripe';

export { TIER_FEATURES } from './billing/tiers';
export type { TierFeatures } from './billing/tiers';

// Security
export { validateEndpointUrl, isObviouslyBlockedUrl } from './security/url-validator';
export { isDisposableEmail } from './security/disposable-emails';

// Workers
export { deliverWebhook, startDeliveryWorker, purgeDeletedApps } from './workers/delivery-worker';
export type { DeliveryResult } from './workers/delivery-worker';
