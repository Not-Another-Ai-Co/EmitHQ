import IORedis from 'ioredis';

/**
 * Shared ioredis connection for BullMQ.
 * Uses TCP (not REST) — required by BullMQ for pub/sub and blocking commands.
 * Upstash requires TLS; maxRetriesPerRequest: null is required for BullMQ workers.
 */
export function createRedisConnection(): IORedis {
  const host = process.env.UPSTASH_REDIS_HOST;
  const password = process.env.UPSTASH_REDIS_PASSWORD;

  if (!host || !password) {
    throw new Error('UPSTASH_REDIS_HOST and UPSTASH_REDIS_PASSWORD are required');
  }

  return new IORedis({
    host,
    port: 6379,
    password,
    tls: {},
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    keepAlive: 10_000,
    lazyConnect: true,
  });
}
