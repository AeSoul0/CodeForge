/**
 * @file frontend/e2e/admin.spec.ts
 * @description End-to-end tests for the administrator dashboard against the
 * real backend: CRUD flows, API playground, system status and navigation.
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_API_KEY ?? 'test-admin-api-key';

async function login(page: Page): Promise<void> {
    await page.goto('/admin/login');
    await page.fill('#username', ADMIN_USERNAME);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('#loginSubmit');
    await page.waitForURL(/\/admin\/dashboard$/);
}

function unique(label: string): string {
    return `${label} ${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

test.describe('Admin dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('overview shows live stats and highlights the active section', async ({ page }) => {
        await expect(page.locator('#stat-backend')).toHaveText('Online');
        await expect(page.locator('#stat-projects')).toHaveText(/^\d+$/);
        await expect(page.locator('#adminUser')).toHaveText(ADMIN_USERNAME);
        await expect(
            page.getByRole('navigation', { name: 'Admin navigation', exact: true }).getByRole('link', { name: 'Overview' }),
        ).toHaveAttribute('aria-current', 'page');
    });

    test('project lifecycle: create, search, edit, delete', async ({ page }) => {
        const title = unique('E2E Project <b>bold</b>');

        await page.goto('/admin/dashboard/projects');
        await expect(page.locator('#projectCount')).toHaveText(/project/);

        await page.click('#newProjectBtn');
        await expect(page.getByRole('dialog', { name: 'New Project' })).toBeVisible();

        await page.fill('#p-titolo', title);
        await page.fill('#p-descrizione', 'Created by the Playwright admin suite.');
        await page.fill('#p-categorie', 'full-stack, ai');
        await page.fill('#p-tecnologie', 'Playwright, Astro');
        await page.click('#projectSaveBtn');

        await expect(page.locator('#toastRegion')).toContainText('Project created.');

        const row = page.locator('#projectsTableBody tr', { hasText: title });
        await expect(row).toHaveCount(1);
        // Stored markup is rendered as text, never as HTML.
        await expect(row.locator('b')).toHaveCount(0);

        await page.fill('#projectSearch', title);
        await expect(page.locator('#projectsTableBody tr')).toHaveCount(1);

        await row.getByRole('button', { name: `Edit ${title}` }).click();
        await page.fill('#p-role', 'QA Automation');
        await page.click('#projectSaveBtn');
        await expect(page.locator('#toastRegion')).toContainText('Project updated.');
        await expect(row).toContainText('QA Automation');

        await row.getByRole('button', { name: `Delete ${title}` }).click();
        const confirm = page.locator('#confirmDialog');
        await expect(confirm).toBeVisible();
        await confirm.getByRole('button', { name: 'Delete' }).click();

        await expect(page.locator('#toastRegion')).toContainText('Deleted');
        await expect(page.locator('#projectsTableBody tr', { hasText: title })).toHaveCount(0);
    });

    test('project form validates input before calling the API', async ({ page }) => {
        await page.goto('/admin/dashboard/projects');
        await page.click('#newProjectBtn');
        await page.fill('#p-titolo', 'ab');
        await page.click('#projectSaveBtn');

        await expect(page.locator('#projectFormError')).toContainText('Title must be between 3 and 100 characters.');

        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'New Project' })).toBeHidden();
    });

    test('experience lifecycle with a logo upload', async ({ page }) => {
        const company = unique('E2E Corp');

        await page.goto('/admin/dashboard/experiences');
        await page.click('#newExpBtn');

        await page.fill('#e-role', 'Test Engineer');
        await page.fill('#e-company', company);
        await page.fill('#e-description', 'Experience created by the Playwright admin suite.');
        await page.fill('#e-technologies', 'Playwright');
        await page.fill('#e-startDate', '2024-03');
        await page.check('#e-current');
        await expect(page.locator('#e-endDate')).toBeDisabled();

        await page.setInputFiles('#e-image', {
            name: 'logo.png',
            mimeType: 'image/png',
            // 1x1 transparent PNG
            buffer: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                'base64',
            ),
        });

        await page.click('#expSaveBtn');
        await expect(page.locator('#toastRegion')).toContainText('Experience created.');

        const row = page.locator('#expTableBody tr', { hasText: company });
        await expect(row).toContainText('Mar 2024 - Present');
        await expect(row.locator('img')).toHaveAttribute('src', /\/api\/experiences\/[a-f0-9]{24}\/image$/);

        await row.getByRole('button', { name: /^Delete/ }).click();
        await page.locator('#confirmDialog').getByRole('button', { name: 'Delete' }).click();
        await expect(page.locator('#expTableBody tr', { hasText: company })).toHaveCount(0);
    });

    test('API playground sends authenticated requests and keeps history', async ({ page }) => {
        await page.goto('/admin/dashboard/api');

        await page.selectOption('#apiPreset', { label: 'GET · Current session' });
        await expect(page.locator('#apiEndpoint')).toHaveValue('/api/auth/me');
        await expect(page.locator('#apiBody')).toBeDisabled();

        await page.click('#sendBtn');

        await expect(page.locator('#resStatus')).toHaveText('Status: 200');
        await expect(page.locator('#apiResponse')).toContainText('"role": "admin"');
        await expect(page.locator('#historyList')).toContainText('/api/auth/me');

        await page.fill('#apiEndpoint', 'relative');
        await page.click('#sendBtn');
        await expect(page.locator('#apiResponse')).toContainText('must be a path');
    });

    test('system page reports healthy probes and metrics', async ({ page }) => {
        await page.goto('/admin/dashboard/system');

        await expect(page.locator('#text-live')).toHaveText('Online');
        await expect(page.locator('#text-ready')).toHaveText('Connected');
        await expect(page.locator('#metric-requests')).toHaveText(/^[\d,]+$/);

        await page.click('#refreshBtn');
        await expect(page.locator('#lastChecked')).toContainText('Last checked');
    });

    test('mobile navigation opens and navigates', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 800 });
        await page.goto('/admin/dashboard');

        const toggle = page.locator('#adminMenuToggle');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');

        await page.locator('#adminMobileNav').getByRole('link', { name: 'System' }).click();
        await expect(page).toHaveURL(/\/admin\/dashboard\/system$/);
    });

    for (const path of [
        '/admin/dashboard',
        '/admin/dashboard/projects',
        '/admin/dashboard/experiences',
        '/admin/dashboard/api',
        '/admin/dashboard/system',
    ]) {
        test(`${path} has no detectable accessibility violations`, async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(path);
            await expect(page.locator('body')).toHaveAttribute('data-admin-ready', 'true');
            // Let the page finish rendering its data before auditing.
            await page.waitForLoadState('networkidle');

            const results = await new AxeBuilder({ page })
                .include('main')
                .exclude('#particleCanvas')
                .analyze();

            expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
        });
    }

    test('dialogs are accessible when open', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/admin/dashboard/projects');
        await page.click('#newProjectBtn');

        const results = await new AxeBuilder({ page }).include('#projectDialog').analyze();

        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });

    test('authenticated visitors skip the login form', async ({ page }) => {
        await page.goto('/admin/login');
        await page.waitForURL(/\/admin\/dashboard$/);
    });
});

test('every admin page redirects anonymous visitors to login', async ({ page }) => {
    for (const path of ['/admin/dashboard/projects', '/admin/dashboard/experiences', '/admin/dashboard/api', '/admin/dashboard/system']) {
        await page.goto(path);
        await page.waitForURL(/\/admin\/login$/);
    }
});
