import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, verifyApiKey, isEmithqApiKey } from './api-key';

describe('generateApiKey', () => {
  it('produces a key with emhq_ prefix', () => {
    const { key } = generateApiKey();
    expect(key).toMatch(/^emhq_[A-Za-z0-9_-]{32}$/);
  });

  it('produces a valid SHA-256 hex hash', () => {
    const { hash } = generateApiKey();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces unique keys on each call', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toBe(b.key);
    expect(a.hash).not.toBe(b.hash);
  });

  it('hash matches re-hashing the key', () => {
    const { key, hash } = generateApiKey();
    expect(hashApiKey(key)).toBe(hash);
  });
});

describe('hashApiKey', () => {
  it('returns consistent hash for the same input', () => {
    const key = 'emhq_test123';
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it('returns different hashes for different inputs', () => {
    expect(hashApiKey('emhq_aaa')).not.toBe(hashApiKey('emhq_bbb'));
  });
});

describe('verifyApiKey', () => {
  it('returns true for a matching key and hash', () => {
    const { key, hash } = generateApiKey();
    expect(verifyApiKey(key, hash)).toBe(true);
  });

  it('returns false for a non-matching key', () => {
    const { hash } = generateApiKey();
    const { key: otherKey } = generateApiKey();
    expect(verifyApiKey(otherKey, hash)).toBe(false);
  });

  it('returns false for a malformed stored hash', () => {
    const { key } = generateApiKey();
    expect(verifyApiKey(key, 'not-a-valid-hex-hash')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(verifyApiKey('', '')).toBe(false);
  });

  it('uses constant-time comparison (does not throw on valid inputs)', () => {
    const { key, hash } = generateApiKey();
    // Should never throw — timingSafeEqual length guard handles mismatches
    expect(() => verifyApiKey(key, hash)).not.toThrow();
    expect(() => verifyApiKey('wrong_key', hash)).not.toThrow();
  });
});

describe('isEmithqApiKey', () => {
  it('returns true for emhq_ prefixed strings', () => {
    expect(isEmithqApiKey('emhq_abc123')).toBe(true);
  });

  it('returns false for other prefixes', () => {
    expect(isEmithqApiKey('sk_live_abc123')).toBe(false);
    expect(isEmithqApiKey('bearer_token')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEmithqApiKey('')).toBe(false);
  });

  it('returns false for partial prefix', () => {
    expect(isEmithqApiKey('emhq')).toBe(false);
    expect(isEmithqApiKey('emh')).toBe(false);
  });
});
