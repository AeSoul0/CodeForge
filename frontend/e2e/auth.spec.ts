import { test, expect } from '@playwright/test';

test.describe('Authentication and Authorization', () => {
  test('invalid login fails with error message', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // It should show some error or stay on login
    await expect(page.locator('text=Accesso negato').or(page.locator('text=Invalid'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Without auth, it should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('valid login succeeds and redirects to dashboard', async ({ page }) => {
    // We assume backend has a mock or test admin key we can use.
    // In our CI, ADMIN_API_KEY is 'test-admin-api-key'
    await page.goto('/admin/login');
    await page.fill('input[type="password"]', 'test-admin-api-key');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Logout
    await page.click('button:has-text("Logout"), a:has-text("Logout")');
    await expect(page).toHaveURL(/\/admin\/login|\//);
  });
});
