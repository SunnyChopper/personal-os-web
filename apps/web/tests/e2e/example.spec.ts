import { test, expect } from '@playwright/test';

/**
 * Example E2E test
 * Replace with actual critical user flow tests:
 * - Authentication flow
 * - Task creation and management
 * - Goal tracking
 * - Metric logging
 */

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.*/);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  // Add navigation tests here
});
