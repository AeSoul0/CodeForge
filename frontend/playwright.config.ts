/**
 * @file frontend/playwright.config.ts
 * @description Playwright end-to-end test configuration for CodeForge.
 *
 * Responsibilities:
 * - Configure the E2E test suite and Chromium project.
 * - Start and monitor the Astro frontend and Fastify backend.
 * - Provide deterministic E2E environment variables.
 * - Keep real multi-worker execution locally.
 * - Exercise the production UI with reduced-motion accessibility preferences.
 * - Wait for backend/frontend readiness before starting tests.
 * - Collect traces, screenshots and videos when tests fail.
 *
 * The reduced-motion preference is intentional:
 * ParticleCanvas respects prefers-reduced-motion and disables
 * its particle simulation under this accessibility preference.
 * This keeps the E2E browser deterministic and tests the UI in
 * an accessibility-supported mode without changing production
 * behavior for users who do not request reduced motion.
 *
 * @requires @playwright/test
 * @requires Node.js path
 */

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

export default defineConfig({
    testDir: './e2e',

    timeout:
        30_000,

    /**
     * Keep true multi-worker execution.
     *
     * Every test receives an isolated browser context, while the
     * shared backend remains the real E2E backend.
     */
    fullyParallel:
        true,

    forbidOnly:
        !!process.env.CI,

    /**
     * The local E2E gate explicitly uses six workers.
     */
    workers:
        process.env.CI
            ? 1
            : 6,

    retries:
        process.env.CI
            ? 2
            : 0,

    reporter: [
        [
            'html',
            {
                open:
                    'never',
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

        /**
         * Test the application with the user's reduced-motion
         * accessibility preference enabled.
         *
         * ParticleCanvas detects this preference and performs
         * zero particle simulation, removing unnecessary animation
         * contention between concurrent Chromium workers.
         */
    },

    webServer: [
        {
            /**
             * Always start a fresh backend for the E2E run.
             *
             * This prevents stale processes, old environment variables,
             * old compiled code, cookies or rate-limit state from leaking
             * into the test suite.
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
             * Astro's Vercel adapter does not support `astro preview`,
             * therefore the E2E frontend uses Astro's development server.
             *
             * reuseExistingServer is disabled so the test suite always
             * receives a fresh process with the expected environment.
             */
            command:
                'npm run dev -- --host 127.0.0.1 --port 4321',

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