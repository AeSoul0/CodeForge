// @ts-check

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    output: 'server',

    adapter: vercel(),

    integrations: [
        react(),
    ],

    redirects: {
        '/docs':
            'https://codeforge-ukq5.onrender.com/docs',
    },

    vite: {
        plugins: [
            tailwindcss(),
        ],
    },

    server: {
        port: 2003,
        host: '0.0.0.0',
    },

    /**
     * Disable the Astro development toolbar during E2E.
     *
     * The toolbar injects its own UI into every page during `astro dev`.
     * That pollutes accessibility scans and can interfere with deterministic
     * Playwright interaction with the application under test.
     */
    devToolbar: {
        enabled: false,
    },
});