import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CodeForge/);
});

test('admin login page renders', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.locator('h1')).toContainText('Admin Access');
});
