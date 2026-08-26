/**
 * @file frontend/e2e/auth.spec.ts
 * @description End-to-end authentication and authorization tests.
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

const usernameInput =
    'input[name="username"]';

const passwordInput =
    'input[name="password"]';

async function openLoginPage(
    page: Page,
): Promise<void> {
    await page.goto(
        '/admin/login',
        {
            waitUntil:
                'domcontentloaded',
        },
    );

    await expect(
        page.locator(
            '#loginForm',
        ),
    ).toBeVisible();

    await expect(
        page.locator(
            usernameInput,
        ),
    ).toBeEditable();

    await expect(
        page.locator(
            passwordInput,
        ),
    ).toBeEditable();
}

async function login(
    page: Page,
): Promise<void> {
    await openLoginPage(
        page,
    );

    await page.fill(
        usernameInput,
        ADMIN_USERNAME,
    );

    await page.fill(
        passwordInput,
        ADMIN_PASSWORD,
    );

    const loginResponsePromise =
        page.waitForResponse(
            (response) =>
                response
                    .url()
                    .includes(
                        '/api/auth/login',
                    ) &&
                response
                    .request()
                    .method() ===
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

    await page.waitForURL(
        /\/admin\/dashboard$/,
        {
            waitUntil:
                'domcontentloaded',
        },
    );
}

test.describe(
    'Authentication and Authorization',
    () => {
        test(
            'invalid login fails and remains on login page',
            async ({ page }) => {
                await openLoginPage(
                    page,
                );

                await page.fill(
                    usernameInput,
                    ADMIN_USERNAME,
                );

                await page.fill(
                    passwordInput,
                    'wrong-password',
                );

                const responsePromise =
                    page.waitForResponse(
                        (response) =>
                            response
                                .url()
                                .includes(
                                    '/api/auth/login',
                                ) &&
                            response
                                .request()
                                .method() ===
                                'POST',
                    );

                await page.click(
                    'button[type="submit"]',
                );

                const response =
                    await responsePromise;

                expect(
                    response.status(),
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
                    {
                        waitUntil:
                            'domcontentloaded',
                    },
                );

                await page.waitForURL(
                    /\/admin\/login$/,
                    {
                        waitUntil:
                            'domcontentloaded',
                    },
                );

                expect(
                    page.url(),
                ).toMatch(
                    /\/admin\/login$/,
                );
            },
        );

        test(
            'valid login succeeds and redirects to dashboard',
            async ({ page }) => {
                await login(
                    page,
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
                await login(
                    page,
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
                await login(
                    page,
                );

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
                            response
                                .url()
                                .includes(
                                    '/api/auth/logout',
                                ) &&
                            response
                                .request()
                                .method() ===
                                'POST',
                    );

                await logoutButton.click();

                const logoutResponse =
                    await logoutResponsePromise;

                expect(
                    logoutResponse.status(),
                ).toBe(200);

                await page.waitForURL(
                    /\/admin\/login$/,
                    {
                        waitUntil:
                            'domcontentloaded',
                    },
                );
            },
        );
    },
);