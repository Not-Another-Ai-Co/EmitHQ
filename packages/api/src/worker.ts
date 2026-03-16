import { startDeliveryWorker } from '@emithq/core';

const worker = startDeliveryWorker();

console.log('EmitHQ delivery worker started (concurrency=5)');

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
