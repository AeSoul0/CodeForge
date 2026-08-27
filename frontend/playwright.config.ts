import {
    defineConfig,
    devices,
} from '@playwright/test';

import path from 'path';

const backendUrl =
    'http://127.0.0.1:3002';

const frontendUrl =
    'http://127.0.0.1:4321';

const backendHealthUrl =
    'http://127.0.0.1:3002/ready';

const playwrightResultsDir =
    path.resolve(
        __dirname,
        '../.playwright-results',
    );

const playwrightReportDir =
    path.resolve(
        __dirname,
        '../.playwright-report',
    );

export default defineConfig({
    testDir:
        './e2e',

    /**
     * Keep real concurrent E2E execution.
     */
    fullyParallel:
        true,

    workers:
        6,

    timeout:
        30_000,

    forbidOnly:
        !!process.env.CI,

    retries:
        process.env.CI
            ? 2
            : 0,

    /**
     * Important:
     *
     * Do not write Playwright videos/traces/screenshots inside
     * the Astro/Vite project root.
     *
     * Otherwise Astro dev can detect those files and trigger HMR
     * while the E2E browser is interacting with the page.
     */
    outputDir:
        playwrightResultsDir,

    reporter: [
        [
            'html',
            {
                open:
                    'never',

                outputFolder:
                    playwrightReportDir,
            },
        ],
        ['line'],
    ],

    use: {
        baseURL:
            frontendUrl,

        trace:
            'retain-on-failure',

        screenshot:
            'only-on-failure',

        video:
            'retain-on-failure',

        actionTimeout:
            15_000,

        navigationTimeout:
            30_000,
    },

    webServer: [
        {
            /**
             * Start a fresh backend for every E2E run.
             */
            command:
                'npm run start',

            url:
                backendHealthUrl,

            timeout:
                120_000,

            reuseExistingServer:
                false,

            cwd:
                path.resolve(
                    __dirname,
                    '../backend',
                ),

            env: {
                ...process.env,

                NODE_ENV:
                    'test',

                E2E:
                    'true',

                PORT:
                    '3002',

                MONGODB_URI:
                    process.env.MONGODB_URI ??
                    'mongodb://127.0.0.1:27017/codeforge_test',

                JWT_SECRET:
                    process.env.JWT_SECRET ??
                    'testsecret123',

                ADMIN_API_KEY:
                    process.env.ADMIN_API_KEY ??
                    'test-admin-api-key',

                FRONTEND_URL:
                    frontendUrl,
            },
        },

        {
            /**
             * Run the Astro SSR frontend used by E2E.
             */
            command:
                'npm run dev -- --port 4321',

            url:
                frontendUrl,

            timeout:
                120_000,

            reuseExistingServer:
                false,

            cwd:
                path.resolve(
                    __dirname,
                ),

            env: {
                ...process.env,

                PUBLIC_API_URL:
                    backendUrl,

                PUBLIC_E2E:
                    'true',
            },
        },
    ],

    projects: [
        {
            name:
                'chromium',

            use: {
                ...devices[
                    'Desktop Chrome'
                ],
            },
        },
    ],
});