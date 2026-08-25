/**
 * @file frontend/playwright.config.ts
 * @description Playwright end-to-end test configuration for CodeForge.
 *
 * Responsibilities:
 * - Configure the E2E test suite and Chromium project.
 * - Start and monitor the Astro frontend and Fastify backend.
 * - Provide deterministic E2E environment variables with CI/local overrides.
 * - Explicitly enable the real backend server for Playwright via E2E=true.
 * - Wait for the backend readiness endpoint before starting the frontend.
 * - Collect traces, screenshots and videos when tests fail.
 * - Apply stricter execution settings in CI.
 *
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string used by the E2E backend.
 * - JWT_SECRET: JWT signing secret used by the E2E backend.
 * - ADMIN_API_KEY: administrative key used by E2E tests.
 *
 * The backend uses NODE_ENV=test for test-safe configuration, while
 * E2E=true explicitly enables the real HTTP server required by Playwright.
 *
 * @requires @playwright/test
 * @requires Node.js path
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const backendUrl =
    'http://127.0.0.1:3002';

const frontendUrl =
    'http://127.0.0.1:4321';

const backendHealthUrl =
    'http://127.0.0.1:3002/ready';

export default defineConfig({
    testDir: './e2e',

    timeout: 30_000,

    fullyParallel: true,

    forbidOnly:
        !!process.env.CI,

    retries:
        process.env.CI
            ? 2
            : 0,

    workers:
        process.env.CI
            ? 1
            : undefined,

    reporter: [
        [
            'html',
            {
                open: 'never',
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
             * Backend must become available before Astro starts rendering
             * pages that perform SSR API requests.
             */
            command:
                'npm run start',

            url:
                backendHealthUrl,

            timeout:
                120_000,

            reuseExistingServer:
                !process.env.CI,

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
            },
        },

        {
            /**
             * Start Astro only after Playwright has confirmed that the
             * backend is accepting HTTP requests.
             */
            command:
                'npm run dev -- --host 127.0.0.1 --port 4321',

            url:
                frontendUrl,

            timeout:
                120_000,

            reuseExistingServer:
                !process.env.CI,

            cwd:
                path.resolve(
                    __dirname,
                ),

            env: {
                ...process.env,

                PUBLIC_API_URL:
                    backendUrl,
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