import { Hono } from 'hono';
import { createClerkClient } from '@clerk/backend';
import {
  adminDb,
  organizations,
  apiKeys,
  generateApiKey,
  trackEvent,
  TIER_LIMITS,
} from '@emithq/core';

// In-memory rate limiter: 3 signups per IP per 24h window
const SIGNUP_RATE_LIMIT = 3;
const SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const ipCounts = new Map<string, { count: number; windowStart: number }>();

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);

  if (!entry || now - entry.windowStart > SIGNUP_WINDOW_MS) {
    ipCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= SIGNUP_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup of expired entries (every hour). unref() allows process exit without waiting.
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of ipCounts) {
      if (now - entry.windowStart > SIGNUP_WINDOW_MS) {
        ipCounts.delete(ip);
      }
    }
  },
  60 * 60 * 1000,
).unref();

export const signupRoutes = new Hono();

/**
 * POST /api/v1/signup — Create account, org, and API key in one request.
 * Public endpoint — no auth required.
 */
signupRoutes.post('/', async (c) => {
  // Validate request body
  let body: { email?: string; password?: string; orgName?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body' } }, 400);
  }

  const { email, password, orgName } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return c.json({ error: { code: 'validation_error', message: 'Valid email is required' } }, 400);
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: 'Password is required (minimum 8 characters)',
        },
      },
      400,
    );
  }

  if (orgName !== undefined && (typeof orgName !== 'string' || orgName.length > 100)) {
    return c.json(
      {
        error: {
          code: 'validation_error',
          message: 'orgName must be a string (max 100 characters)',
        },
      },
      400,
    );
  }

  // Rate limit check
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('cf-connecting-ip') ||
    'unknown';

  if (!checkSignupRateLimit(ip)) {
    return c.json(
      {
        error: {
          code: 'rate_limited',
          message: 'Too many signups from this IP. Try again later.',
        },
      },
      429,
    );
  }

  // Create Clerk user + org
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  let clerkUser: { id: string };
  let clerkOrg: { id: string; name: string; slug: string };

  try {
    clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password,
      publicMetadata: { source: 'api_signup' },
    });
  } catch (err: unknown) {
    const clerkErr = err as { errors?: Array<{ code?: string; message?: string }> };
    if (clerkErr.errors?.some((e) => e.code === 'form_identifier_exists')) {
      return c.json(
        { error: { code: 'conflict', message: 'An account with this email already exists' } },
        409,
      );
    }
    console.error('Clerk createUser failed:', JSON.stringify(clerkErr.errors ?? err));
    return c.json({ error: { code: 'signup_failed', message: 'Failed to create account' } }, 500);
  }

  try {
    const name = orgName || `${email.split('@')[0]}'s org`;
    clerkOrg = await clerk.organizations.createOrganization({
      name,
      createdBy: clerkUser.id,
    });
  } catch (err: unknown) {
    const clerkErr = err as { errors?: Array<{ code?: string; message?: string }> };
    console.error('Clerk createOrganization failed:', JSON.stringify(clerkErr.errors ?? err));
    // Clerk user created but org creation failed — user can still sign in via dashboard
    return c.json(
      {
        error: {
          code: 'signup_failed',
          message: 'Account created but organization setup failed. Sign in to continue.',
        },
      },
      500,
    );
  }

  // Provision EmitHQ org row (mirrors auth.ts auto-provision)
  let [org] = await adminDb
    .insert(organizations)
    .values({
      clerkOrgId: clerkOrg.id,
      name: clerkOrg.name,
      slug: clerkOrg.slug || clerkOrg.id,
    })
    .onConflictDoNothing({ target: organizations.clerkOrgId })
    .returning({ id: organizations.id });

  // Handle race condition: if onConflictDoNothing returned nothing, re-fetch
  if (!org) {
    const { eq } = await import('drizzle-orm');
    [org] = await adminDb
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.clerkOrgId, clerkOrg.id))
      .limit(1);
  }

  if (!org) {
    return c.json(
      { error: { code: 'signup_failed', message: 'Failed to provision organization' } },
      500,
    );
  }

  trackEvent('org.created', org.id, { source: 'api_signup' });

  // Generate first API key
  const { key, hash } = generateApiKey();
  await adminDb.insert(apiKeys).values({
    orgId: org.id,
    keyHash: hash,
    name: 'Default Key',
  });

  trackEvent('api_key.created', org.id, { source: 'api_signup' });

  return c.json(
    {
      data: {
        orgId: org.id,
        apiKey: key,
        userId: clerkUser.id,
        tier: 'free',
        eventLimit: TIER_LIMITS.free,
        credential_storage_hint: {
          env_var: 'EMITHQ_API_KEY',
          '1password':
            "op item create --vault EmitHQ --title 'EmitHQ API Key' --category 'API Credential' 'credential=<YOUR_API_KEY>'",
        },
      },
    },
    201,
  );
});
