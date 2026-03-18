import { test, expect } from '@playwright/test';
import { createWebhookServer } from './fixtures/webhook-server';
import fs from 'fs';
import path from 'path';

/**
 * Browser-based new-user journey — tests the full 8-step flow.
 *
 * Prerequisites:
 * - Dashboard running on DASHBOARD_URL (default: http://localhost:4002)
 * - API server running on API_URL (default: http://localhost:4000)
 * - BullMQ worker running (for delivery verification)
 * - Clerk test user authenticated (via global.setup.ts storageState)
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const authFile = path.join(__dirname, '../playwright/.clerk/user.json');

test.describe('Browser journey', () => {
  test.describe.configure({ mode: 'serial' });

  let appId: string;
  let apiKey: string;
  let webhookUrl: string;
  const webhookServer = createWebhookServer();

  test.beforeAll(async () => {
    // Guard: fail fast if auth state is missing
    if (!fs.existsSync(authFile)) {
      throw new Error(`Auth state file not found at ${authFile}. Run global.setup.ts first.`);
    }
    webhookUrl = await webhookServer.start();
  });

  test.afterAll(async () => {
    await webhookServer.stop();
  });

  test('1. dashboard loads after auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=EmitHQ')).toBeVisible({ timeout: 10_000 });
  });

  test('2. create application', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page content to load
    const newAppBtn = page.getByRole('button', {
      name: /new application|create first application/i,
    });
    await expect(newAppBtn).toBeVisible({ timeout: 10_000 });
    await newAppBtn.click();

    // Fill the form
    await page.getByPlaceholder('My App').fill('E2E Test App');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for creation to complete
    await expect(page.getByText('E2E Test App')).toBeVisible({ timeout: 10_000 });

    // Select the app — navigates to /dashboard/app/[appId]
    await page.getByText('E2E Test App').click();
    await page.waitForURL(/\/dashboard\/app\//);

    // Extract appId from URL path
    const url = new URL(page.url());
    const match = url.pathname.match(/\/dashboard\/app\/([^/]+)/);
    appId = match ? decodeURIComponent(match[1]) : '';
    expect(appId).toBeTruthy();
  });

  test('3. generate API key', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page content
    const genBtn = page.getByRole('button', { name: /generate new key|generate first key/i });
    await expect(genBtn).toBeVisible({ timeout: 10_000 });
    await genBtn.click();

    // Fill key name
    await page.getByPlaceholder('Production API key').fill('E2E Test Key');
    await page.getByRole('button', { name: 'Generate Key' }).click();

    // Wait for modal with the key
    await expect(page.getByText('API Key Created')).toBeVisible({ timeout: 10_000 });

    // Capture the key from the <code> element in the modal
    const codeEl = page.locator('dialog code, [role="dialog"] code').first();
    await expect(codeEl).toBeVisible();
    apiKey = (await codeEl.textContent()) || '';
    expect(apiKey).toMatch(/^emhq_/);

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('4. create endpoint', async ({ page }) => {
    await page.goto(`/dashboard/app/${appId}/endpoints`);

    // Wait for page content
    const newBtn = page.getByRole('button', { name: /new endpoint|create first endpoint/i });
    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();

    // Fill URL with webhook test server
    await page.getByPlaceholder('https://your-app.com/webhooks').fill(webhookUrl);
    await page.getByRole('button', { name: 'Create Endpoint' }).click();

    // Wait for signing secret modal
    await expect(page.getByText('Signing Secret')).toBeVisible({ timeout: 10_000 });

    // Verify secret is shown
    const secretEl = page.locator('dialog code, [role="dialog"] code').first();
    await expect(secretEl).toBeVisible();
    const secret = await secretEl.textContent();
    expect(secret).toMatch(/^whsec_/);

    // Close modal
    await page.keyboard.press('Escape');
  });

  test('5. send event via API', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/app/${appId}/msg`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        eventType: 'e2e.test',
        payload: { test: true, timestamp: Date.now() },
      },
    });

    expect(res.status()).toBe(202);
    const json = await res.json();
    expect(json.data.id).toBeTruthy();
    expect(json.data.eventType).toBe('e2e.test');

    // Verify quota headers
    expect(res.headers()['x-emithq-quota-limit']).toBeTruthy();
    expect(res.headers()['x-emithq-tier']).toBeTruthy();
  });

  test('6. verify event appears in dashboard', async ({ page }) => {
    await page.goto(`/dashboard/app/${appId}/events`);

    // Wait for the event to appear
    await expect(page.getByText('e2e.test')).toBeVisible({ timeout: 15_000 });
  });

  test('7. verify webhook delivery received', async () => {
    // Wait for the BullMQ worker to deliver (poll up to 30s)
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (webhookServer.getPayloads().length > 0) break;
      await new Promise((r) => setTimeout(r, 1000));
    }

    const payloads = webhookServer.getPayloads();
    expect(payloads.length).toBeGreaterThan(0);

    // Verify Standard Webhooks headers
    const first = payloads[0];
    expect(first.headers['webhook-id']).toBeTruthy();
    expect(first.headers['webhook-timestamp']).toBeTruthy();
    expect(first.headers['webhook-signature']).toBeTruthy();

    // Verify payload content
    const body = JSON.parse(first.body);
    expect(body).toBeTruthy();
  });

  test('8. getting-started shows all steps completed', async ({ page }) => {
    // Clear onboarding dismissed state
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('emithq_onboarding_dismissed'));

    await page.goto('/dashboard/getting-started');

    // All 4 steps should be completed
    await expect(page.getByText(/4 of 4 steps complete|All done/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
