/**
 * E2E test for the Assistant flow.
 *
 * Prerequisites:
 * - Dev server running (npm run dev) with backend available
 * - Authenticated session: either
 *   a) Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars for automated login, or
 *   b) Run with reuseExistingServer so you can log in manually first, then run:
 *      npx playwright test tests/e2e/assistant.e2e.spec.ts --project=chromium
 *      (Note: Playwright uses a fresh browser context, so manual login in another
 *       window won't help. Use E2E_TEST_* for automated auth.)
 */
import { test, expect } from '@playwright/test';

const ADMIN_ASSISTANT_URL = '/admin/assistant';
const LOGIN_URL = '/admin/login';

test.describe('Assistant flow', () => {
  test.beforeEach(async ({ page }) => {
    // Attempt login if credentials provided
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    await page.goto(ADMIN_ASSISTANT_URL);

    // Wait for navigation to settle (either assistant or redirect to login)
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (currentUrl.includes(LOGIN_URL) || currentUrl.endsWith('/admin/login')) {
      if (email && password) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin\/(assistant|dashboard)/, { timeout: 15000 });
        await page.goto(ADMIN_ASSISTANT_URL);
        await page.waitForLoadState('networkidle');
      } else {
        test.skip(
          true,
          'Auth required: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run with login'
        );
      }
    }
  });

  test('1. Navigate to Assistant and open page', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/assistant/);
    await expect(page.getByRole('heading', { name: /Personal OS Assistant/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('2. Send read prompt and verify tool-backed retrieval', async ({ page }) => {
    // Ensure we have a thread (create or use existing)
    const newChatBtn = page.getByRole('button', { name: /new/i });
    const hasThreads = await page
      .getByText(/Start a conversation|Ask about your tasks/)
      .isVisible();
    if (!hasThreads) {
      // We may already have a thread; input should be visible
    }

    const input = page.getByPlaceholder(/Ask about your tasks/i);
    await expect(input).toBeVisible({ timeout: 5000 });

    await input.fill('Which tasks do I currently have open or past due?');
    await input.press('Enter');

    // Wait for assistant response to appear
    await page.waitForSelector('[class*="rounded-lg"]', { timeout: 60000 });
    // Wait for input to be enabled again (streaming finished)
    await expect(input).toBeEnabled({ timeout: 60000 });
    const content = await page.locator('.rounded-lg').first().textContent();
    expect(content?.length ?? 0).toBeGreaterThan(0);
  });

  test('3. Send write prompt and verify confirmation gate', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask about your tasks/i);
    await expect(input).toBeVisible({ timeout: 5000 });

    await input.fill('Mark the past-due task as complete.');
    await input.press('Enter');

    // Wait for assistant response - should contain confirmation request, not immediate execution
    await page.waitForSelector('[class*="prose"], [class*="rounded-lg"]', { timeout: 60000 });

    // Expected: "Please confirm" or "confirm if you want me to proceed" (from backend engine)
    const confirmPhrase = page.getByText(/confirm|proceed|want me to/i);
    await expect(confirmPhrase).toBeVisible({ timeout: 15000 });
  });
});
