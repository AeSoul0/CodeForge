// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),

  integrations: [react()],

  redirects: {
    '/docs': 'https://codeforge-ukq5.onrender.com/docs',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  server: {
    port: 2003,
    host: true,
  },
});