import { test, expect } from '@playwright/test';

/**
 * Full AI course wizard (topic → quiz → generate) requires Cognito auth and a live API.
 * Run manually against dev when verifying course WebSocket + REST flows.
 */
test.describe('Course generator (admin)', () => {
  test.skip('course generator page is reachable when authenticated', async ({ page }) => {
    await page.goto('/admin/knowledge-vault/courses/new');
    await expect(page.getByRole('heading', { name: /AI Course Generator/i })).toBeVisible();
  });
});
