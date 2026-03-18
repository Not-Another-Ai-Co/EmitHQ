import { test, expect } from '@playwright/test';

/**
 * Account management tests — verify profile, password reset, and org settings
 * are accessible and functional.
 *
 * Note: Clerk's <UserProfile /> renders in an iframe, limiting deep interaction.
 * These are smoke tests verifying the pages load and key elements are visible.
 */

test.describe('Account Management', () => {
  test('profile page loads with Clerk UserProfile', async ({ page }) => {
    await page.goto('/dashboard/profile');

    // Page heading should be visible
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    // Clerk's UserProfile component should render (may be in an iframe)
    // Wait for either a Clerk-rendered element or the profile container
    const profileContainer = page.locator(
      '.cl-userProfile-root, [data-clerk-component="UserProfile"]',
    );
    await expect(profileContainer).toBeVisible({ timeout: 15_000 });
  });

  test('profile page is accessible from sidebar nav', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Profile in sidebar
    const profileLink = page.getByRole('link', { name: 'Profile' });
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    await page.waitForURL('**/dashboard/profile**');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('billing page loads with current plan', async ({ page }) => {
    await page.goto('/dashboard/billing');

    // Should show current tier info
    await expect(page.getByText(/Free|Starter|Growth|Scale/)).toBeVisible({ timeout: 10_000 });
  });

  test('settings page loads with API key management', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Should show the generate key button or existing keys
    const keySection = page.getByRole('button', { name: /generate.*key/i });
    await expect(keySection).toBeVisible({ timeout: 10_000 });
  });

  test('sign-in page is accessible (password reset entry point)', async ({ page }) => {
    // Navigate to sign-in page — this is where "Forgot password?" link lives
    await page.goto('/sign-in');
    await expect(page.locator('text=/sign in/i')).toBeVisible({ timeout: 10_000 });
    // Clerk's hosted sign-in should render without errors
  });

  // Org member management — skipped: Clerk org management UI is not exposed
  // in the current dashboard. Will be tested when org settings page is added.
});
