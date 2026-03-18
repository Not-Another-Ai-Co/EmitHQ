import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

setup.describe.configure({ mode: 'serial' });

setup('clerk setup', async () => {
  await clerkSetup();

  const required = [
    'E2E_CLERK_USER_EMAIL',
    'E2E_CLERK_USER_PASSWORD',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing env vars: ${missing.join(', ')}. ` +
        'Run with: op run --env-file=../../.env.tpl -- npx playwright test',
    );
  }
});

const authFile = path.join(__dirname, '../playwright/.clerk/user.json');

setup('authenticate', async ({ page }) => {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // Navigate to a page that loads Clerk JS (required before signIn)
  await page.goto('/');

  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_EMAIL!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Confirm we reach the dashboard
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });

  // Save auth state for reuse
  await page.context().storageState({ path: authFile });
});
