import { createMiddleware } from 'hono/factory';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { eq, isNull, and, or, gt } from 'drizzle-orm';
import { adminDb, apiKeys, organizations, hashApiKey, isEmithqApiKey } from '@emithq/core';
import { createClerkClient } from '@clerk/backend';
import type { AuthEnv } from '../types';

/**
 * Clerk session middleware — mount globally to inject Clerk auth state.
 * Handles JWT verification automatically via @clerk/backend.
 */
export const clerk = clerkMiddleware();

/**
 * Auth middleware that supports dual authentication:
 * 1. Custom API keys (Bearer emhq_...) — looked up in api_keys table
 * 2. Clerk session tokens — for dashboard users
 *
 * Sets orgId, userId, authType on the Hono context for downstream handlers.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'unauthorized', message: 'Missing Bearer token' } }, 401);
  }

  const token = authHeader.slice(7);

  // Path 1: Custom API key
  if (isEmithqApiKey(token)) {
    const keyHash = hashApiKey(token);
    const now = new Date();

    // Use admin DB — api_keys table is not RLS-protected, and we need to
    // identify the org BEFORE we can set the tenant context
    const [keyRow] = await adminDb
      .select({
        orgId: apiKeys.orgId,
        id: apiKeys.id,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          isNull(apiKeys.revokedAt),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now)),
        ),
      )
      .limit(1);

    if (!keyRow) {
      return c.json({ error: { code: 'unauthorized', message: 'Invalid API key' } }, 401);
    }

    c.set('orgId', keyRow.orgId);
    c.set('authType', 'api_key' as const);
    // No userId for API key auth — it's org-level
    c.set('userId', null);

    // Update last_used_at in background (non-blocking)
    adminDb
      .update(apiKeys)
      .set({ lastUsedAt: now })
      .where(eq(apiKeys.id, keyRow.id))
      .catch(() => {});

    return next();
  }

  // Path 2: Clerk session token
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        error: { code: 'unauthorized', message: 'Authentication required' },
      },
      401,
    );
  }

  if (!auth.orgId) {
    return c.json(
      {
        error: {
          code: 'no_active_organization',
          message: 'Select an organization to continue',
        },
      },
      403,
    );
  }

  // Look up our internal org ID from Clerk's org ID — auto-provision if missing
  let [org] = await adminDb
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.clerkOrgId, auth.orgId))
    .limit(1);

  if (!org) {
    // Auto-provision: fetch org name from Clerk, create our record
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const clerkOrg = await clerk.organizations.getOrganization({ organizationId: auth.orgId });
      const slug = clerkOrg.slug || auth.orgId;

      [org] = await adminDb
        .insert(organizations)
        .values({
          clerkOrgId: auth.orgId,
          name: clerkOrg.name,
          slug,
        })
        .onConflictDoNothing({ target: organizations.clerkOrgId })
        .returning({ id: organizations.id });

      // Handle race condition: if onConflictDoNothing returned nothing, re-fetch
      if (!org) {
        [org] = await adminDb
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.clerkOrgId, auth.orgId))
          .limit(1);
      }
    } catch {
      return c.json({ error: { code: 'org_not_found', message: 'Organization not found' } }, 404);
    }

    if (!org) {
      return c.json({ error: { code: 'org_not_found', message: 'Organization not found' } }, 404);
    }
  }

  c.set('orgId', org.id);
  c.set('userId', auth.userId);
  c.set('authType', 'clerk_session' as const);

  return next();
});

/**
 * Role-based access control middleware.
 * For Clerk sessions, checks orgRole. For API keys, grants full access (org-level).
 */
export function requireRole(...allowedRoles: string[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const authType = c.get('authType');

    // API keys have full org access
    if (authType === 'api_key') {
      return next();
    }

    // Clerk sessions — check org role
    const auth = getAuth(c);
    const role = auth?.orgRole;

    if (!role || !allowedRoles.includes(role)) {
      return c.json({ error: { code: 'forbidden', message: 'Insufficient permissions' } }, 403);
    }

    return next();
  });
}
