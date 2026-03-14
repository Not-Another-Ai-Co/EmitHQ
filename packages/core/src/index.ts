// @emithq/core — Delivery engine, retry logic, signing, queue workers
export const VERSION = '0.1.0';

// Database
export { db, adminDb, pool, adminPool } from './db/client';
export { withTenant } from './db/tenant';
export * from './db/schema';
export type * from './db/types';

// Auth
export { generateApiKey, hashApiKey, verifyApiKey, isEmithqApiKey } from './auth/api-key';
export type { GeneratedKey } from './auth/api-key';

// Queue
export { getDeliveryQueue, enqueueDelivery } from './queue/delivery-queue';
export { createRedisConnection } from './queue/redis';
export {
  computeBackoffDelay,
  webhookBackoffStrategy,
  RETRY_DELAYS_MS,
  MAX_DELIVERY_ATTEMPTS,
} from './queue/backoff';
export { replayDelivery, replayMessage, reEnableEndpoint } from './queue/replay';
export type { DeliveryJobData } from './queue/delivery-queue';

// Signing
export {
  signWebhook,
  buildWebhookHeaders,
  verifyWebhook,
  generateSigningSecret,
} from './signing/webhook-signer';

// Workers
export {
  deliverWebhook,
  processDeliveryJob,
  startDeliveryWorker,
  handleExhaustedDelivery,
} from './workers/delivery-worker';
export type { DeliveryResult } from './workers/delivery-worker';
