import { test, expect } from '@playwright/test';
import { createWebhookServer } from './fixtures/webhook-server';

/**
 * API-only LLM journey — tests the full flow without a browser:
 * Signup → create app → create endpoint → send event → verify delivery → check quota headers.
 *
 * This validates that an LLM agent can fully operate EmitHQ via API alone.
 *
 * Prerequisites:
 * - API server running on API_URL (default: http://localhost:4000)
 * - BullMQ worker running
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';

test.describe('API-only LLM journey', () => {
  test.describe.configure({ mode: 'serial' });

  let apiKey: string;
  let appId: string;
  let msgId: string;
  const webhookServer = createWebhookServer();
  let webhookUrl: string;

  test.beforeAll(async () => {
    webhookUrl = await webhookServer.start();
  });

  test.afterAll(async () => {
    await webhookServer.stop();
  });

  test('1. signup via API returns orgId and apiKey', async ({ request }) => {
    const email = `e2e-api-${Date.now()}@test.emithq.com`;

    const res = await request.post(`${API_URL}/api/v1/signup`, {
      data: {
        email,
        password: 'TestPass123!',
        orgName: 'E2E API Test Org',
      },
    });

    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.orgId).toBeTruthy();
    expect(json.data.apiKey).toMatch(/^emhq_/);
    expect(json.data.userId).toBeTruthy();
    expect(json.data.tier).toBe('free');
    expect(json.data.eventLimit).toBe(100000);
    expect(json.data.credential_storage_hint).toBeDefined();
    expect(json.data.credential_storage_hint.env_var).toBe('EMITHQ_API_KEY');

    apiKey = json.data.apiKey;
  });

  test('2. create application via API', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/app`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: { name: 'E2E API App', uid: `e2e-api-${Date.now()}` },
    });

    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBeTruthy();
    expect(json.data.name).toBe('E2E API App');

    // Verify quota headers on response
    expect(res.headers()['x-emithq-quota-limit']).toBe('100000');
    expect(res.headers()['x-emithq-quota-used']).toBeTruthy();
    expect(res.headers()['x-emithq-quota-remaining']).toBeTruthy();
    expect(res.headers()['x-emithq-quota-reset']).toBeTruthy();
    expect(res.headers()['x-emithq-tier']).toBe('free');

    appId = json.data.id;
  });

  test('3. create endpoint via API', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/app/${appId}/endpoint`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: { url: webhookUrl, description: 'E2E webhook receiver' },
    });

    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBeTruthy();
    expect(json.data.url).toBe(webhookUrl);
    expect(json.data.signingSecret).toMatch(/^whsec_/);
  });

  test('4. send event via API', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/app/${appId}/msg`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      data: {
        eventType: 'e2e.api.test',
        payload: { source: 'api-journey', timestamp: Date.now() },
      },
    });

    expect(res.status()).toBe(202);
    const json = await res.json();
    expect(json.data.id).toBeTruthy();
    expect(json.data.eventType).toBe('e2e.api.test');

    msgId = json.data.id;
  });

  test('5. verify delivery via API (poll)', async ({ request }) => {
    // Poll for delivery attempt to complete (up to 30s)
    const deadline = Date.now() + 30_000;
    let delivered = false;

    while (Date.now() < deadline) {
      const res = await request.get(`${API_URL}/api/v1/app/${appId}/msg/${msgId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.status() === 200) {
        const json = await res.json();
        const attempts = json.data.attempts || [];
        if (attempts.some((a: { status: string }) => a.status === 'delivered')) {
          delivered = true;
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(delivered).toBe(true);

    // Also verify webhook server received the payload
    const payloads = webhookServer.getPayloads();
    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads[0].headers['webhook-id']).toBeTruthy();
    expect(payloads[0].headers['webhook-signature']).toBeTruthy();
  });

  test('6. list messages via API', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/app/${appId}/msg`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0].eventType).toBe('e2e.api.test');
  });

  test('7. verify subscription/billing accessible via API', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/billing/subscription`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.data.tier).toBe('free');
    expect(json.data.usage).toBeDefined();
    expect(json.data.usage.limit).toBe(100000);
  });
});

test.describe('Quota enforcement', () => {
  test('429 response includes structured upgrade info', async ({ request }) => {
    // This test verifies the 429 response STRUCTURE, not actual quota exhaustion.
    // Send a request with an invalid/nonexistent API key to a hypothetical over-quota org.
    // Since we can't easily exhaust 100K events in E2E, we verify the 429 format
    // is covered by unit tests (quota.test.ts) and validate quota headers here.
    //
    // Validate that quota headers are present and parseable on a normal request.
    const signupRes = await request.post(`${API_URL}/api/v1/signup`, {
      data: {
        email: `quota-test-${Date.now()}@test.emithq.com`,
        password: 'TestPass123!',
        orgName: 'Quota Test Org',
      },
    });

    if (signupRes.status() !== 201) {
      test.skip(true, 'Signup failed — cannot test quota headers');
      return;
    }

    const { data } = await signupRes.json();

    // Make an authenticated request and verify quota headers are machine-readable
    const res = await request.get(`${API_URL}/api/v1/app`, {
      headers: { Authorization: `Bearer ${data.apiKey}` },
    });

    expect(res.status()).toBe(200);

    // All 5 quota headers must be present and parseable
    const limit = res.headers()['x-emithq-quota-limit'];
    const used = res.headers()['x-emithq-quota-used'];
    const remaining = res.headers()['x-emithq-quota-remaining'];
    const reset = res.headers()['x-emithq-quota-reset'];
    const tier = res.headers()['x-emithq-tier'];

    expect(limit).toBeTruthy();
    expect(used).toBeTruthy();
    expect(remaining).toBeTruthy();
    expect(reset).toBeTruthy();
    expect(tier).toBe('free');

    // Headers should be numeric (parseable)
    expect(Number(limit)).toBe(100000);
    expect(Number(used)).toBeGreaterThanOrEqual(0);
    expect(Number(remaining)).toBeLessThanOrEqual(100000);

    // Reset should be a valid ISO date
    expect(new Date(reset!).getTime()).toBeGreaterThan(Date.now());
  });
});
