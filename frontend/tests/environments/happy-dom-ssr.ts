/**
 * @file frontend/tests/environments/happy-dom-ssr.ts
 * @description happy-dom DOM globals with the SSR Vite environment.
 *
 * The built-in happy-dom environment transforms modules for the client,
 * which compiles .astro files without their server renderer. Admin tests
 * need both: the real page markup (rendered with the Astro Container API)
 * and a DOM to run the client modules against.
 */

import type { Environment } from 'vitest/runtime';
import { builtinEnvironments } from 'vitest/runtime';

const happyDom = builtinEnvironments['happy-dom'];

const environment: Environment = {
    name: 'happy-dom-ssr',
    viteEnvironment: 'ssr',
    setup(global, options) {
        return happyDom.setup(global, options);
    },
};

export default environment;
