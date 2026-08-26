/**
 * @file frontend/e2e/accessibility.spec.ts
 * @description Automated accessibility checks for CodeForge.
 */

import {
    expect,
    test,
    type Page,
} from '@playwright/test';

import AxeBuilder from '@axe-core/playwright';

test.describe.configure({
    mode: 'serial',
    timeout: 60_000,
});

async function stabilizePage(
    page: Page,
): Promise<void> {
    await page.emulateMedia({
        reducedMotion: 'reduce',
    });

    await page.waitForLoadState(
        'domcontentloaded',
    );

    await expect(
        page.locator('body'),
    ).toBeVisible();

    await page.addStyleTag({
        content: `
            *,
            *::before,
            *::after {
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
                caret-color: transparent !important;
            }

            /*
             * Decorative particle rendering is not part of the
             * accessibility surface. Keep it out of the audit
             * environment to make axe deterministic.
             */
            #particleCanvas {
                display: none !important;
            }
        `,
    });
}

async function runAccessibilityScan(
    page: Page,
    selector: string,
): Promise<void> {
    await expect(
        page.locator(selector),
    ).toBeVisible();

    const results =
        await new AxeBuilder({
            page,
        })
            .include(selector)
            .options({
                iframes: false,
            })
            .analyze();

    expect(
        results.violations,
        JSON.stringify(
            results.violations,
            null,
            2,
        ),
    ).toEqual([]);
}

test.describe(
    'Accessibility tests',
    () => {
        test(
            'homepage should not have any automatically detectable accessibility issues',
            async ({ page }) => {
                await page.goto(
                    '/',
                    {
                        waitUntil:
                            'domcontentloaded',
                        timeout:
                            30_000,
                    },
                );

                await stabilizePage(
                    page,
                );

                await expect(
                    page.locator(
                        'main#main-content',
                    ),
                ).toBeVisible();

                await runAccessibilityScan(
                    page,
                    'main#main-content',
                );

                const footer =
                    page.locator(
                        'footer',
                    );

                if (
                    await footer.count() >
                    0
                ) {
                    await runAccessibilityScan(
                        page,
                        'footer',
                    );
                }
            },
        );

        test(
            'admin login should not have accessibility issues',
            async ({ page }) => {
                await page.goto(
                    '/admin/login',
                    {
                        waitUntil:
                            'domcontentloaded',
                        timeout:
                            30_000,
                    },
                );

                await stabilizePage(
                    page,
                );

                await expect(
                    page.locator(
                        '#loginForm',
                    ),
                ).toBeVisible();

                await expect(
                    page.locator(
                        'input[name="username"]',
                    ),
                ).toBeEditable();

                await expect(
                    page.locator(
                        'input[name="password"]',
                    ),
                ).toBeEditable();

                await runAccessibilityScan(
                    page,
                    '#loginForm',
                );
            },
        );
    },
);