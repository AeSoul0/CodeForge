/**
 * @file backend/tests/unit/csrf.test.ts
 * @description Unit tests for the cookie-session CSRF guard and the login schema.
 */

import fastify, {
    type FastifyInstance,
} from 'fastify';
import fastifyCookie from '@fastify/cookie';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    createCsrfGuard,
} from '../../src/middlewares/csrf';
import authRoutes from '../../src/routes/authRoutes';

vi.mock(
    '../../src/services/AdminService',
    () => ({
        adminService: {
            validateCredentials: vi.fn(),
        },
    }),
);

const TRUSTED = 'https://www.aesoul0.com';

async function buildApp(): Promise<FastifyInstance> {
    const app = fastify();

    await app.register(fastifyCookie);

    app.addHook(
        'onRequest',
        createCsrfGuard([
            `${TRUSTED}/`,
        ]),
    );

    app.get('/api/items', async () => ({ ok: true }));
    app.delete('/api/items/:id', async () => ({ ok: true }));
    app.post('/api/auth/login', async () => ({ ok: true }));

    await app.ready();

    return app;
}

describe('createCsrfGuard', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = await buildApp();
    });

    afterEach(async () => {
        await app.close();
    });

    it('lets safe methods through even with a session cookie', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/items',
            cookies: { token: 'x' },
            headers: { origin: 'https://evil.example' },
        });

        expect(res.statusCode).toBe(200);
    });

    it('lets cookie-less mutations through (no ambient credentials)', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
        });

        expect(res.statusCode).toBe(200);
    });

    it('requires the custom header on cookie-authenticated mutations', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: { origin: TRUSTED },
        });

        expect(res.statusCode).toBe(403);
        expect(res.json().error.code).toBe('CSRF_HEADER_MISSING');
    });

    it('accepts trusted origin plus header (trailing slash normalised)', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: {
                origin: TRUSTED,
                'x-requested-with': 'CodeForge',
            },
        });

        expect(res.statusCode).toBe(200);
    });

    it('accepts a header-bearing request without Origin (non-browser client)', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: { 'x-requested-with': 'CodeForge' },
        });

        expect(res.statusCode).toBe(200);
    });

    it('rejects untrusted origins even with the header', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: {
                origin: 'https://evil.example',
                'x-requested-with': 'CodeForge',
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.json().error.code).toBe('CSRF_ORIGIN_REJECTED');
    });

    it('falls back to the Referer when Origin is absent', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: {
                referer: 'https://evil.example/page',
                'x-requested-with': 'CodeForge',
            },
        });

        expect(res.statusCode).toBe(403);
    });

    it('ignores an unparsable Referer', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/api/items/1',
            cookies: { token: 'x' },
            headers: {
                referer: 'not a url',
                'x-requested-with': 'CodeForge',
            },
        });

        expect(res.statusCode).toBe(200);
    });

    it('checks the origin of login requests without a cookie', async () => {
        const rejected = await app.inject({
            method: 'POST',
            url: '/api/auth/login?next=1',
            headers: { origin: 'https://evil.example' },
        });

        const accepted = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            headers: { origin: TRUSTED },
        });

        expect(rejected.statusCode).toBe(403);
        expect(accepted.statusCode).toBe(200);
    });
});

describe('login schema', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = fastify();
        await app.register(fastifyCookie);
        await app.register(
            (await import('@fastify/jwt')).default,
            { secret: 'test' },
        );
        await app.register(authRoutes, { prefix: '/api/auth' });
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it.each([
        ['missing password', { username: 'admin' }],
        ['operator injection', { username: { $ne: null }, password: 'x' }],
        ['oversized password', { username: 'admin', password: 'x'.repeat(201) }],
    ])('rejects %s with 400', async (_label, payload) => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload,
        });

        expect(res.statusCode).toBe(400);
    });

    it('strips unexpected properties before the handler runs', async () => {
        const { adminService } = await import('../../src/services/AdminService');
        vi.mocked(adminService.validateCredentials).mockRejectedValueOnce(
            Object.assign(new Error('Invalid credentials'), { statusCode: 401 }),
        );

        const res = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { username: 'admin', password: 'x', role: 'admin' },
        });

        expect(res.statusCode).toBe(401);
        expect(adminService.validateCredentials).toHaveBeenCalledWith('admin', 'x');
    });
});

describe('login rate limit configuration', () => {
    async function limitFor(value: string | undefined): Promise<unknown> {
        const routes: Array<{ path: string; options: { config?: { rateLimit?: { max?: number } } } }> = [];
        const fake = {
            post: (path: string, options: never) => routes.push({ path, options }),
            get: () => undefined,
        };

        if (value === undefined) {
            delete process.env.LOGIN_RATE_LIMIT_MAX;
        } else {
            process.env.LOGIN_RATE_LIMIT_MAX = value;
        }

        await authRoutes(fake as never);
        delete process.env.LOGIN_RATE_LIMIT_MAX;

        return routes.find((route) => route.path === '/login')?.options.config?.rateLimit?.max;
    }

    it('defaults to 5 and accepts only positive integers', async () => {
        expect(await limitFor(undefined)).toBe(5);
        expect(await limitFor('50')).toBe(50);
        expect(await limitFor('abc')).toBe(5);
        expect(await limitFor('-1')).toBe(5);
    });
});

describe('positiveInteger', () => {
    it('parses positive integers and falls back otherwise', async () => {
        const { positiveInteger } = await import('../../src/utils/settings');

        expect(positiveInteger('12', 1)).toBe(12);
        expect(positiveInteger(undefined, 3)).toBe(3);
        expect(positiveInteger('1.5', 3)).toBe(3);
        expect(positiveInteger('0', 3)).toBe(3);
    });
});
