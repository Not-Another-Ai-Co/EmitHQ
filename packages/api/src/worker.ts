import { startDeliveryWorker, purgeDeletedApps } from '@emithq/core';

const worker = startDeliveryWorker();

console.log('EmitHQ delivery worker started (concurrency=5)');

// Run purge on startup and then daily at 2am UTC
purgeDeletedApps()
  .then((count) => {
    if (count > 0) console.log(`Purged ${count} expired soft-deleted app(s)`);
  })
  .catch((err) => console.error('Purge expired apps failed:', err));

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
setInterval(() => {
  purgeDeletedApps()
    .then((count) => {
      if (count > 0) console.log(`Purged ${count} expired soft-deleted app(s)`);
    })
    .catch((err) => console.error('Purge expired apps failed:', err));
}, PURGE_INTERVAL_MS);

// Graceful shutdown with forced exit fallback
const shutdown = async () => {
  console.log('Shutting down delivery worker...');
  const forceExit = setTimeout(() => process.exit(1), 30_000);
  await worker.close();
  clearTimeout(forceExit);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
