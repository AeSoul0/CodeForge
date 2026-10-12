// @ts-check

import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

const env = loadEnv(
    process.env.NODE_ENV ?? 'production',
    process.cwd(),
    '',
);

/**
 * Origin of the backend API, allowed in connect-src.
 */
const apiOrigin = new URL(
    env.PUBLIC_API_URL || 'https://codeforge-ukq5.onrender.com',
).origin;

export default defineConfig({
    output: 'server',

    /**
     * Content Security Policy.
     *
     * Astro hashes every script and style it emits and writes the policy
     * into a <meta http-equiv="content-security-policy"> tag, so neither
     * script-src nor style-src needs 'unsafe-inline'. The policy is only
     * applied to production builds (not `astro dev`).
     */
    security: {
        csp: {
            directives: [
                "default-src 'self'",
                `connect-src 'self' ${apiOrigin}`,
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                'upgrade-insecure-requests',
            ],
        },
    },

    adapter: vercel({
        isr: {
            expiration: 300,
        },
    }),

    /**
     * Shiki emits inline styles that a hash-based CSP cannot allow. The
     * site does not render code blocks through Astro's Markdown pipeline.
     */
    markdown: {
        syntaxHighlight: false,
    },

    redirects: {
        '/docs':
            'https://codeforge-ukq5.onrender.com/docs',
    },

    vite: {
        plugins: [
            tailwindcss(),
        ],

        server: {
            watch: {
                ignored: [
                    '**/.playwright-results/**',
                    '**/.playwright-report/**',
                    '**/test-results/**',
                    '**/playwright-report/**',
                ],
            },
        },
    },

    server: {
        port: 2003,
        host: '0.0.0.0',
    },

    devToolbar: {
        enabled: false,
    },
});