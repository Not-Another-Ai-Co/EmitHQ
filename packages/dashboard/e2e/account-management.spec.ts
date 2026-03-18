import { test, expect } from '@playwright/test';

/**
 * Account management tests — verify profile, billing, and API key management
 * are accessible via the consolidated settings page.
 *
 * Note: Clerk's <UserProfile /> renders in an iframe, limiting deep interaction.
 * These are smoke tests verifying the pages load and key elements are visible.
 */

test.describe('Account Management', () => {
  test('settings page loads with API key tab by default', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Should show the generate key button or existing keys
    const keySection = page.getByRole('button', { name: /generate.*key/i });
    await expect(keySection).toBeVisible({ timeout: 10_000 });
  });

  test('billing tab loads with current plan', async ({ page }) => {
    await page.goto('/dashboard/settings?tab=billing');

    // Should show current tier info
    await expect(page.getByText(/Free|Starter|Growth|Scale/)).toBeVisible({ timeout: 10_000 });
  });

  test('profile tab loads with Clerk UserProfile', async ({ page }) => {
    await page.goto('/dashboard/settings?tab=profile');

    // Clerk's UserProfile component should render (may be in an iframe)
    const profileContainer = page.locator(
      '.cl-userProfile-root, [data-clerk-component="UserProfile"]',
    );
    await expect(profileContainer).toBeVisible({ timeout: 15_000 });
  });

  test('danger zone tab shows placeholder', async ({ page }) => {
    await page.goto('/dashboard/settings?tab=danger-zone');

    await expect(page.getByText(/no recently deleted apps/i)).toBeVisible({ timeout: 10_000 });
  });

  test('/dashboard/billing redirects to settings billing tab', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForURL('**/dashboard/settings?tab=billing');
  });

  test('/dashboard/profile redirects to settings profile tab', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForURL('**/dashboard/settings?tab=profile');
  });

  test('sign-in page is accessible (password reset entry point)', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('text=/sign in/i')).toBeVisible({ timeout: 10_000 });
  });
});
