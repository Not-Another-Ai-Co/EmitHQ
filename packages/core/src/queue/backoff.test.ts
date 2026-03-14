import { describe, it, expect } from 'vitest';
import {
  computeBackoffDelay,
  webhookBackoffStrategy,
  RETRY_DELAYS_MS,
  MAX_DELIVERY_ATTEMPTS,
} from './backoff';

describe('RETRY_DELAYS_MS', () => {
  it('has 7 entries (7 retries after initial attempt)', () => {
    expect(RETRY_DELAYS_MS).toHaveLength(7);
  });

  it('matches the architecture spec schedule', () => {
    expect(RETRY_DELAYS_MS[0]).toBe(5_000); // 5s
    expect(RETRY_DELAYS_MS[1]).toBe(30_000); // 30s
    expect(RETRY_DELAYS_MS[2]).toBe(120_000); // 2m
    expect(RETRY_DELAYS_MS[3]).toBe(900_000); // 15m
    expect(RETRY_DELAYS_MS[4]).toBe(3_600_000); // 1h
    expect(RETRY_DELAYS_MS[5]).toBe(14_400_000); // 4h
    expect(RETRY_DELAYS_MS[6]).toBe(86_400_000); // 24h
  });
});

describe('MAX_DELIVERY_ATTEMPTS', () => {
  it('equals retries + 1 (initial attempt)', () => {
    expect(MAX_DELIVERY_ATTEMPTS).toBe(8);
  });
});

describe('computeBackoffDelay', () => {
  it('returns a value between 0 and the cap for attempt 1', () => {
    for (let i = 0; i < 50; i++) {
      const delay = computeBackoffDelay(1);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(5_000);
    }
  });

  it('returns a value between 0 and the cap for attempt 3 (~2m)', () => {
    for (let i = 0; i < 50; i++) {
      const delay = computeBackoffDelay(3);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(120_000);
    }
  });

  it('returns a value between 0 and the cap for attempt 7 (~24h)', () => {
    for (let i = 0; i < 50; i++) {
      const delay = computeBackoffDelay(7);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(86_400_000);
    }
  });

  it('clamps to the last schedule entry for attempts beyond 7', () => {
    for (let i = 0; i < 50; i++) {
      const delay = computeBackoffDelay(100);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(86_400_000); // capped at 24h
    }
  });

  it('produces varying delays (not deterministic)', () => {
    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(computeBackoffDelay(5));
    }
    // With full jitter over 1h range, 20 samples should produce multiple unique values
    expect(delays.size).toBeGreaterThan(1);
  });

  it('returns an integer (no fractional ms)', () => {
    for (let i = 0; i < 10; i++) {
      const delay = computeBackoffDelay(3);
      expect(Number.isInteger(delay)).toBe(true);
    }
  });
});

describe('webhookBackoffStrategy', () => {
  it('delegates to computeBackoffDelay', () => {
    // Both functions should produce delays in the same range
    for (let i = 0; i < 20; i++) {
      const delay = webhookBackoffStrategy(2);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThan(30_000); // attempt 2 cap
    }
  });
});
