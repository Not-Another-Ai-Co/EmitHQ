/**
 * Webhook delivery retry schedule with full jitter.
 *
 * Schedule matches architecture spec:
 *   Retry 1: ~5s, Retry 2: ~30s, Retry 3: ~2m, Retry 4: ~15m,
 *   Retry 5: ~1h, Retry 6: ~4h, Retry 7: ~24h
 *
 * Full jitter: actual delay = random(0, cap) for each retry.
 */

/** Maximum delay caps per retry attempt (ms). Index 0 = first retry. */
export const RETRY_DELAYS_MS: readonly number[] = [
  5_000, // retry 1: ~5s
  30_000, // retry 2: ~30s
  120_000, // retry 3: ~2m
  900_000, // retry 4: ~15m
  3_600_000, // retry 5: ~1h
  14_400_000, // retry 6: ~4h
  86_400_000, // retry 7: ~24h
];

/** Total attempts including the initial delivery. */
export const MAX_DELIVERY_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // 8

/**
 * Compute the backoff delay for a given attempt number.
 * Uses full jitter: random(0, cap) where cap is the schedule entry.
 *
 * @param attemptsMade - 1-based: 1 after first failure, 2 after second, etc.
 * @returns Delay in milliseconds (0 to cap).
 */
export function computeBackoffDelay(attemptsMade: number): number {
  const index = Math.min(attemptsMade - 1, RETRY_DELAYS_MS.length - 1);
  const cap = RETRY_DELAYS_MS[index];
  return Math.floor(Math.random() * cap);
}

/**
 * BullMQ backoffStrategy callback.
 * Registered on the Worker's settings to control retry timing.
 */
export function webhookBackoffStrategy(attemptsMade: number): number {
  return computeBackoffDelay(attemptsMade);
}
