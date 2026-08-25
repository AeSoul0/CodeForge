import { test, expect } from '@playwright/test';

test.describe('API error handling', () => {
  test('homepage handles API failure gracefully', async ({ page }) => {
    // Mock the backend to return 500
    await page.route('**/api/projects', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    await page.goto('/');
    
    // The page should still render the main structure
    await expect(page.locator('h1').first()).toBeVisible();
    
    // An error indicator might be shown, but the page shouldn't crash
    await expect(page.locator('body')).toBeVisible();
  });
});
