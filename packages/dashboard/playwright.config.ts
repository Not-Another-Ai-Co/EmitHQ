import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.DASHBOARD_URL || 'http://localhost:4002';

export default defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  outputDir: 'test-results/',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // serial — tests depend on each other within suites

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'global setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'browser-journey',
      testMatch: /browser-journey\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
      },
      dependencies: ['global setup'],
    },
    {
      name: 'api-journey',
      testMatch: /api-journey\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['global setup'],
    },
    {
      name: 'account-management',
      testMatch: /account-management\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
      },
      dependencies: ['global setup'],
    },
  ],
});
