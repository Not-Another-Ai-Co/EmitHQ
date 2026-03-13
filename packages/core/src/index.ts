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
