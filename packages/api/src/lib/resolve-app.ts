import type { db } from '@emithq/core';
import { applications } from '@emithq/core';
import { eq, or, and, isNull } from 'drizzle-orm';
import { UUID_RE } from './constants';

/** Resolve an application by UUID or uid within the tenant scope. */
export async function resolveApp(tx: typeof db, appId: string): Promise<{ id: string } | null> {
  const condition = UUID_RE.test(appId)
    ? or(eq(applications.id, appId), eq(applications.uid, appId))
    : eq(applications.uid, appId);
  const [app] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(and(condition, isNull(applications.deletedAt)))
    .limit(1);
  return app ?? null;
}
