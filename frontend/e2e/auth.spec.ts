/**
 * @file frontend/e2e/auth.spec.ts
 * @description End-to-end authentication and authorization tests.
 *
 * Covered flows:
 * - invalid administrator credentials are rejected;
 * - unauthenticated access to the dashboard is rejected;
 * - valid administrator login succeeds;
 * - authenticated administrators can access dashboard content;
 * - logout clears the authenticated session.
 */

import {
    expect,
    test,
    type Page,
} from '@playwright/test';

const ADMIN_USERNAME =
    process.env.E2E_ADMIN_USERNAME ??
    'admin';

const ADMIN_PASSWORD =
    process.env.ADMIN_API_KEY ??
    'test-admin-api-key';

/**
 * Authenticate an administrator through the real login UI.
 */
async function login(
    page: Page,
): Promise<void> {
    await page.goto(
        '/admin/login',
    );

    await page.fill(
        'input[name="username"]',
        ADMIN_USERNAME,
    );

    await page.fill(
        'input[name="password"]',
        ADMIN_PASSWORD,
    );

    const loginResponsePromise =
        page.waitForResponse(
            (response) =>
                response.url().includes(
                    '/api/auth/login',
                ) &&
                response.request().method() ===
                    'POST',
        );

    await page.click(
        'button[type="submit"]',
    );

    const loginResponse =
        await loginResponsePromise;

    expect(
        loginResponse.status(),
    ).toBe(200);

    await expect(
        page,
    ).toHaveURL(
        /\/admin\/dashboard/,
    );
}

test.describe(
    'Authentication and Authorization',
    () => {
        test(
            'invalid login fails and remains on login page',
            async ({ page }) => {
                await page.goto(
                    '/admin/login',
                );

                await page.fill(
                    'input[name="username"]',
                    ADMIN_USERNAME,
                );

                await page.fill(
                    'input[name="password"]',
                    'wrong-password',
                );

                const loginResponsePromise =
                    page.waitForResponse(
                        (response) =>
                            response.url().includes(
                                '/api/auth/login',
                            ) &&
                            response.request().method() ===
                                'POST',
                    );

                await page.click(
                    'button[type="submit"]',
                );

                const loginResponse =
                    await loginResponsePromise;

                expect(
                    loginResponse.status(),
                ).toBe(401);

                await expect(
                    page,
                ).toHaveURL(
                    /\/admin\/login/,
                );

                await expect(
                    page.locator(
                        '[role="alert"]',
                    ),
                ).toContainText(
                    /invalid credentials/i,
                );
            },
        );

        test(
            'protected dashboard redirects unauthenticated users to login',
            async ({ page }) => {
                await page.goto(
                    '/admin/dashboard',
                );

                await expect(
                    page,
                ).toHaveURL(
                    /\/admin\/login/,
                );
            },
        );

        test(
            'valid login succeeds and redirects to dashboard',
            async ({ page }) => {
                await login(page);

                await expect(
                    page,
                ).toHaveURL(
                    /\/admin\/dashboard/,
                );

                await expect(
                    page.getByRole(
                        'heading',
                        {
                            name:
                                'Dashboard Overview',
                            exact:
                                true,
                        },
                    ),
                ).toBeVisible();
            },
        );

        test(
            'authenticated user can access protected dashboard content',
            async ({ page }) => {
                await login(page);

                await expect(
                    page.getByRole(
                        'heading',
                        {
                            name:
                                'Dashboard Overview',
                            exact:
                                true,
                        },
                    ),
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        'link',
                        {
                            name:
                                'Projects',
                            exact:
                                true,
                        },
                    ),
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        'link',
                        {
                            name:
                                'Experiences',
                            exact:
                                true,
                        },
                    ),
                ).toBeVisible();
            },
        );

        test(
            'logout ends the authenticated session',
            async ({ page }) => {
                await login(page);

                const logoutButton =
                    page.getByRole(
                        'button',
                        {
                            name:
                                /logout|esci/i,
                        },
                    );

                await expect(
                    logoutButton,
                ).toBeVisible();

                const logoutResponsePromise =
                    page.waitForResponse(
                        (response) =>
                            response.url().includes(
                                '/api/auth/logout',
                            ) &&
                            response.request().method() ===
                                'POST',
                    );

                await logoutButton.click();

                const logoutResponse =
                    await logoutResponsePromise;

                expect(
                    logoutResponse.status(),
                ).toBe(200);

                await expect(
                    page,
                ).toHaveURL(
                    /\/admin\/login/,
                );
            },
        );
    },
);
