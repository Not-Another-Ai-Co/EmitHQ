import { sql } from 'drizzle-orm';
import { db } from './client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Execute a callback within a transaction scoped to a specific tenant.
 * Sets `app.current_tenant` via SET LOCAL (transaction-scoped, auto-cleared on commit/rollback).
 * All queries within the callback are subject to RLS policies filtering by org_id.
 */
export async function withTenant<T>(
  orgId: string,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(orgId)) {
    throw new Error(`Invalid tenant ID: expected UUID, got "${orgId}"`);
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant = ${orgId}`);
    return callback(tx as unknown as typeof db);
  });
}
