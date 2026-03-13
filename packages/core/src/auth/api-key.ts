import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const KEY_PREFIX = 'emhq';
const KEY_BYTES = 24; // 192 bits of entropy

export interface GeneratedKey {
  /** Plaintext key — return to user ONCE, never store */
  key: string;
  /** SHA-256 hex digest — store in database */
  hash: string;
}

/**
 * Generate a new API key with the emhq_ prefix.
 * Returns both the plaintext key (show once) and the hash (store in DB).
 */
export function generateApiKey(): GeneratedKey {
  const random = randomBytes(KEY_BYTES).toString('base64url');
  const key = `${KEY_PREFIX}_${random}`;
  const hash = hashApiKey(key);
  return { key, hash };
}

/**
 * Compute SHA-256 hex digest of an API key.
 * Used for both storage and lookup.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an incoming API key against a stored hash using constant-time comparison.
 * Prevents timing attacks by comparing SHA-256 digest buffers.
 */
export function verifyApiKey(incomingKey: string, storedHash: string): boolean {
  const incomingHash = createHash('sha256').update(incomingKey).digest();
  const storedBuffer = Buffer.from(storedHash, 'hex');

  // Length guard: timingSafeEqual throws on mismatched lengths.
  // SHA-256 always produces 32 bytes, so this only fails on malformed stored hashes.
  if (incomingHash.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(incomingHash, storedBuffer);
}

/**
 * Check if a string looks like an EmitHQ API key (prefix check).
 * Use for fast-reject before DB lookup.
 */
export function isEmithqApiKey(value: string): boolean {
  return value.startsWith(`${KEY_PREFIX}_`);
}
