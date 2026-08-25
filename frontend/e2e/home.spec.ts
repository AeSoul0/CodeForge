/**
 * @file frontend/e2e/home.spec.ts
 * @description Basic frontend smoke tests.
 */

import {
    expect,
    test,
} from '@playwright/test';

test(
    'homepage has title',
    async ({ page }) => {
        await page.goto('/');

        await expect(
            page,
        ).toHaveTitle(
            /CodeForge/,
        );
    },
);

test(
    'admin login page renders',
    async ({ page }) => {
        await page.goto(
            '/admin/login',
        );

        await expect(
            page.getByRole(
                'heading',
                {
                    name: 'Admin Access',
                    exact: true,
                },
            ),
        ).toBeVisible();
    },
);