import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coreMock } from '../test-helpers/mock-core';

// Mock core BEFORE importing routes
vi.mock('@emithq/core', () => coreMock());

// Mock Clerk Backend API
const mockCreateUser = vi.fn();
const mockCreateOrganization = vi.fn();
vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({
    users: { createUser: mockCreateUser },
    organizations: { createOrganization: mockCreateOrganization },
  })),
}));

import { signupRoutes } from './signup';
import { Hono } from 'hono';
import { jsonRequest } from '../test-helpers/create-test-app';

function createSignupApp() {
  const app = new Hono();
  app.route('/api/v1/signup', signupRoutes);
  return app;
}

// Reset the in-memory rate limiter between tests by using unique IPs
let testIpCounter = 0;
function uniqueIp(): string {
  return `10.0.0.${++testIpCounter}`;
}

function signupRequest(body: Record<string, unknown>, ip?: string): Request {
  const req = jsonRequest('/api/v1/signup', { method: 'POST', body });
  // Override the x-forwarded-for header with a unique IP
  const headers = new Headers(req.headers);
  headers.set('x-forwarded-for', ip || uniqueIp());
  return new Request(req.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/signup', () => {
  let app: ReturnType<typeof createSignupApp>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = createSignupApp();

    // Default happy-path mocks
    mockCreateUser.mockResolvedValue({ id: 'user_clerk_123' });
    mockCreateOrganization.mockResolvedValue({
      id: 'org_clerk_456',
      name: 'Test Org',
      slug: 'test-org',
    });
  });

  async function mockOrgInsert(orgId = 'uuid-org-1') {
    const { adminDb } = await import('@emithq/core');
    const db = adminDb as unknown as Record<string, ReturnType<typeof vi.fn>>;

    // The default mock chain: insert→values→onConflictDoNothing→returning all return `this`
    // Just set returning to resolve with the org ID for the first call
    db.returning.mockResolvedValueOnce([{ id: orgId }]);
    // Second call (API key insert) uses values → resolves (default mock returns undefined which is fine)
  }

  it('creates account and returns orgId + apiKey (201)', async () => {
    await mockOrgInsert();

    const res = await app.request(
      signupRequest({ email: 'user@example.com', password: 'securepass123', orgName: 'Acme' }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.orgId).toBe('uuid-org-1');
    expect(json.data.apiKey).toMatch(/^emhq_/);
    expect(json.data.userId).toBe('user_clerk_123');
    expect(json.data.tier).toBe('free');
    expect(json.data.eventLimit).toBe(100000);
    expect(json.data.credential_storage_hint).toBeDefined();
    expect(json.data.credential_storage_hint.env_var).toBe('EMITHQ_API_KEY');
  });

  it('uses email prefix as org name when orgName omitted', async () => {
    await mockOrgInsert();

    await app.request(signupRequest({ email: 'jane@acme.com', password: 'securepass123' }));

    expect(mockCreateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ name: "jane's org" }),
    );
  });

  it('rejects missing email (400)', async () => {
    const res = await app.request(signupRequest({ password: 'securepass123' }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
    expect(json.error.message).toContain('email');
  });

  it('rejects invalid email format (400)', async () => {
    const res = await app.request(
      signupRequest({ email: 'not-an-email', password: 'securepass123' }),
    );

    expect(res.status).toBe(400);
  });

  it('rejects password shorter than 8 chars (400)', async () => {
    const res = await app.request(signupRequest({ email: 'user@example.com', password: 'short' }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('8 characters');
  });

  it('rejects missing password (400)', async () => {
    const res = await app.request(signupRequest({ email: 'user@example.com' }));

    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON body (400)', async () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-forwarded-for': uniqueIp(),
    });
    const res = await app.request(
      new Request('http://localhost/api/v1/signup', {
        method: 'POST',
        headers,
        body: 'not json',
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('validation_error');
  });

  it('returns 409 when email already exists in Clerk', async () => {
    mockCreateUser.mockRejectedValue({
      errors: [{ code: 'form_identifier_exists' }],
    });

    const res = await app.request(
      signupRequest({ email: 'taken@example.com', password: 'securepass123' }),
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('conflict');
  });

  it('returns 500 on Clerk user creation failure (non-duplicate)', async () => {
    mockCreateUser.mockRejectedValue(new Error('Clerk down'));

    const res = await app.request(
      signupRequest({ email: 'user@example.com', password: 'securepass123' }),
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('signup_failed');
  });

  it('returns 500 when Clerk org creation fails', async () => {
    mockCreateOrganization.mockRejectedValue(new Error('Org creation failed'));

    const res = await app.request(
      signupRequest({ email: 'user@example.com', password: 'securepass123' }),
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.message).toContain('organization setup failed');
  });

  it('calls trackEvent for org and API key creation', async () => {
    await mockOrgInsert();

    await app.request(signupRequest({ email: 'user@example.com', password: 'securepass123' }));

    const { trackEvent } = await import('@emithq/core');
    expect(trackEvent).toHaveBeenCalledWith('org.created', 'uuid-org-1', {
      source: 'api_signup',
    });
    expect(trackEvent).toHaveBeenCalledWith('api_key.created', 'uuid-org-1', {
      source: 'api_signup',
    });
  });

  it('rate limits after 3 signups from same IP', async () => {
    const ip = uniqueIp();
    await mockOrgInsert();
    await mockOrgInsert();
    await mockOrgInsert();

    // First 3 should succeed (or at least not be rate-limited)
    const { adminDb } = await import('@emithq/core');
    const db = adminDb as unknown as Record<string, ReturnType<typeof vi.fn>>;

    for (let i = 0; i < 3; i++) {
      mockCreateUser.mockResolvedValueOnce({ id: `user_${i}` });
      mockCreateOrganization.mockResolvedValueOnce({
        id: `org_${i}`,
        name: 'Org',
        slug: `org-${i}`,
      });
      db.returning.mockResolvedValueOnce([{ id: `uuid-${i}` }]);

      await app.request(
        signupRequest({ email: `user${i}@test.com`, password: 'securepass123' }, ip),
      );
    }

    // 4th from same IP should be rate-limited
    const res = await app.request(
      signupRequest({ email: 'user4@test.com', password: 'securepass123' }, ip),
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe('rate_limited');
  });
});
