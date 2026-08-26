// @ts-check

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
    output: 'server',

    adapter: vercel({
        isr: {
            expiration: 300,
        },
    }),

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