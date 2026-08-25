/**
 * @file frontend/e2e/auth.spec.ts
 * @description End-to-end authentication and authorization tests.
 *
 * Verifies:
 * - invalid admin credentials are rejected;
 * - protected routes redirect unauthenticated users;
 * - valid admin authentication succeeds;
 * - authenticated users can access protected content;
 * - logout invalidates the authenticated session.
 *
 * These tests run against the real frontend/backend stack through
 * Playwright and are intended to protect critical authentication flows.
 *
 * @requires Playwright
 * @environment ADMIN_API_KEY must match the test environment configured
 * by playwright.config.ts / CI.
 */

import { expect, test } from '@playwright/test';

test.describe('Authentication and Authorization', () => {
    test('invalid login fails and remains on login page', async ({
        page,
    }) => {
        await page.goto('/admin/login');

        await page.fill(
            'input[type="password"]',
            'wrong-password',
        );

        await page.click(
            'button[type="submit"]',
        );

        await expect(page).toHaveURL(
            /\/admin\/login/,
        );

        const errorMessage = page
            .locator(
                'text=Accesso negato',
            )
            .or(
                page.locator(
                    'text=Invalid',
                ),
            )
            .or(
                page.locator(
                    'text=Unauthorized',
                ),
            );

        await expect(
            errorMessage.first(),
        ).toBeVisible({
            timeout: 5_000,
        });
    });

    test('protected dashboard redirects unauthenticated users to login', async ({
        page,
    }) => {
        await page.goto(
            '/admin/dashboard',
        );

        await expect(page).toHaveURL(
            /\/admin\/login/,
        );
    });

    test('valid login succeeds and redirects to dashboard', async ({
        page,
    }) => {
        await page.goto('/admin/login');

        await page.fill(
            'input[type="password"]',
            'test-admin-api-key',
        );

        await page.click(
            'button[type="submit"]',
        );

        await expect(page).toHaveURL(
            /\/admin\/dashboard/,
        );

        await expect(
            page.locator('h1'),
        ).toContainText(
            'Dashboard',
        );
    });

    test('authenticated user can access protected dashboard content', async ({
        page,
    }) => {
        await page.goto('/admin/login');

        await page.fill(
            'input[type="password"]',
            'test-admin-api-key',
        );

        await page.click(
            'button[type="submit"]',
        );

        await expect(page).toHaveURL(
            /\/admin\/dashboard/,
        );

        await expect(
            page.locator('h1'),
        ).toBeVisible();

        await expect(
            page.locator('body'),
        ).not.toContainText(
            'Accesso negato',
        );
    });

    test('logout ends the authenticated session', async ({
        page,
    }) => {
        await page.goto('/admin/login');

        await page.fill(
            'input[type="password"]',
            'test-admin-api-key',
        );

        await page.click(
            'button[type="submit"]',
        );

        await expect(page).toHaveURL(
            /\/admin\/dashboard/,
        );

        const logoutButton = page
            .getByRole('button', {
                name: /logout|esci/i,
            })
            .or(
                page.getByRole('link', {
                    name: /logout|esci/i,
                }),
            );

        await expect(
            logoutButton.first(),
        ).toBeVisible();

        await logoutButton.first().click();

        await expect(page).toHaveURL(
            /\/admin\/login|\/$/,
        );

        await page.goto(
            '/admin/dashboard',
        );

        await expect(page).toHaveURL(
            /\/admin\/login/,
        );
    });
});