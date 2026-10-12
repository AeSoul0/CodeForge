/**
 * @file frontend/tests/helpers.ts
 * @description Shared helpers for frontend unit and rendering tests.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { vi } from 'vitest';

type AstroComponent = Parameters<AstroContainer['renderToString']>[0];

let container: AstroContainer | null = null;

/**
 * Render an Astro component to an HTML string.
 */
export async function renderAstro(
    component: AstroComponent,
    options: Parameters<AstroContainer['renderToString']>[1] = {},
): Promise<string> {
    container ??= await AstroContainer.create();

    return container.renderToString(component, options);
}

/**
 * Render a page and load its markup (without scripts) into the current
 * happy-dom document, so client modules run against the real markup.
 */
export async function mountAstro(
    component: AstroComponent,
    options: Parameters<AstroContainer['renderToString']>[1] = {},
): Promise<void> {
    const html = await renderAstro(component, options);
    const parsed = new DOMParser().parseFromString(html, 'text/html');

    parsed.querySelectorAll('script').forEach((script) => script.remove());

    document.head.innerHTML = parsed.head.innerHTML;
    document.body.innerHTML = parsed.body.innerHTML;

    for (const attribute of [...document.body.attributes]) {
        document.body.removeAttribute(attribute.name);
    }

    for (const attribute of [...parsed.body.attributes]) {
        document.body.setAttribute(attribute.name, attribute.value);
    }
}

export interface MockResponse {
    status?: number;
    body?: unknown;
}

export type RouteHandler =
    | MockResponse
    | ((init: RequestInit | undefined, url: URL) => MockResponse | Promise<MockResponse>);

/**
 * Install a fetch mock routing "METHOD /path" (query string ignored unless
 * the key contains "?") to canned responses. Unknown routes return 404.
 */
export function mockFetch(
    routes: Record<string, RouteHandler>,
) {
    const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = (init?.method ?? 'GET').toUpperCase();
        const handler =
            routes[`${method} ${url.pathname}${url.search}`] ??
            routes[`${method} ${url.pathname}`];

        if (!handler) {
            return new Response(JSON.stringify({ message: 'Not mocked' }), { status: 404 });
        }

        const result = typeof handler === 'function' ? await handler(init, url) : handler;

        const body =
            result.body === undefined
                ? null
                : typeof result.body === 'string'
                    ? result.body
                    : JSON.stringify(result.body);

        return new Response(body, { status: result.status ?? 200 });
    });

    vi.stubGlobal('fetch', fn);

    return fn;
}

/**
 * Wait for pending promise callbacks and timers scheduled with 0 delay.
 */
export async function flush(times = 5): Promise<void> {
    for (let index = 0; index < times; index += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

export function jsonBody(init: RequestInit | undefined): unknown {
    return init?.body ? JSON.parse(String(init.body)) : undefined;
}
