/// <reference types="vitest/config" />
/**
 * @file frontend/vitest.config.ts
 * @description Unit and component-rendering tests for the frontend.
 *
 * - Pure modules and client scripts run in Node or happy-dom
 *   (per-file `@vitest-environment` pragma).
 * - .astro components and pages are rendered with the Astro Container API,
 *   so their server-side logic counts toward coverage.
 */

import { fileURLToPath } from 'node:url';

import { getViteConfig } from 'astro/config';

export default getViteConfig({
    resolve: {
        alias: {
            // Enables `// @vitest-environment happy-dom-ssr` (see the file).
            'vitest-environment-happy-dom-ssr': fileURLToPath(
                new URL('./tests/environments/happy-dom-ssr.ts', import.meta.url),
            ),
        },
    },
    test: {
        include: ['tests/**/*.test.ts'],
        restoreMocks: true,
        unstubGlobals: true,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,astro}'],
            reporter: ['text', 'json-summary', 'html'],
            reportsDirectory: './coverage',
            thresholds: {
                statements: 90,
                branches: 90,
                functions: 90,
                lines: 90,
            },
        },
    },
});
