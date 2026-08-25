/**
 * @file backend/tests/unit/AuthRoutes.test.ts
 * @description Unit tests for administrator authentication routes.
 *
 * Covered endpoints:
 * - POST /login
 * - GET /me
 * - POST /logout
 *
 * The Fastify instance is mocked so these tests remain isolated from the
 * actual HTTP server and database.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type {
    FastifyInstance,
} from 'fastify';

import authRoutes from '../../src/routes/authRoutes';

import {
    adminService,
} from '../../src/services/AdminService';

vi.mock(
    '../../src/services/AdminService',
    () => ({
        adminService: {
            validateCredentials:
                vi.fn(),
        },
    }),
);

type RouteHandler = (
    request: Record<string, unknown>,
    reply: Record<string, unknown>,
) => unknown;

type RegisteredRoute = {
    method:
        | 'GET'
        | 'POST';

    path: string;

    handler:
        | RouteHandler
        | undefined;
};

type MockReply = {
    status: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    setCookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
};

describe(
    'authRoutes',
    () => {
        const registeredRoutes:
            RegisteredRoute[] = [];

        const post =
            vi.fn(
                (
                    path: string,
                    ...args: unknown[]
                ) => {
                    const handler =
                        args.find(
                            (
                                value,
                            ) =>
                                typeof value ===
                                'function',
                        ) as
                            | RouteHandler
                            | undefined;

                    registeredRoutes.push({
                        method:
                            'POST',
                        path,
                        handler,
                    });
                },
            );

        const get =
            vi.fn(
                (
                    path: string,
                    ...args: unknown[]
                ) => {
                    const handler =
                        args.find(
                            (
                                value,
                            ) =>
                                typeof value ===
                                'function',
                        ) as
                            | RouteHandler
                            | undefined;

                    registeredRoutes.push({
                        method:
                            'GET',
                        path,
                        handler,
                    });
                },
            );

        const sign =
            vi.fn();

        const setCookie =
            vi.fn();

        const clearCookie =
            vi.fn();

        const fastify =
            {
                post,
                get,
                jwt: {
                    sign,
                },
                setCookie,
                clearCookie,
            } as unknown as FastifyInstance;

        function createReply(): MockReply {
            const reply = {
                status:
                    vi.fn(),
                send:
                    vi.fn(),
                setCookie,
                clearCookie,
            };

            reply.status.mockReturnValue(
                reply,
            );

            reply.send.mockReturnValue(
                reply,
            );

            return reply;
        }

        function findRoute(
            method:
                | 'GET'
                | 'POST',
            path: string,
        ): RegisteredRoute {
            const route =
                registeredRoutes.find(
                    (
                        item,
                    ) =>
                        item.method ===
                            method &&
                        item.path ===
                            path,
                );

            if (!route) {
                throw new Error(
                    `Route not registered: ${method} ${path}`,
                );
            }

            return route;
        }

        beforeEach(
            () => {
                vi.clearAllMocks();

                registeredRoutes.length =
                    0;

                post.mockClear();
                get.mockClear();

                sign.mockReset();
                setCookie.mockReset();
                clearCookie.mockReset();

                sign.mockReturnValue(
                    'signed-test-token',
                );

                process.env.NODE_ENV =
                    'test';
            },
        );

        afterEach(
            () => {
                process.env.NODE_ENV =
                    'test';
            },
        );

        it(
            'registers login, me and logout routes',
            async () => {
                await authRoutes(
                    fastify,
                );

                expect(
                    registeredRoutes,
                ).toEqual(
                    expect.arrayContaining(
                        [
                            expect.objectContaining(
                                {
                                    method:
                                        'POST',
                                    path:
                                        '/login',
                                },
                            ),
                            expect.objectContaining(
                                {
                                    method:
                                        'GET',
                                    path:
                                        '/me',
                                },
                            ),
                            expect.objectContaining(
                                {
                                    method:
                                        'POST',
                                    path:
                                        '/logout',
                                },
                            ),
                        ],
                    ),
                );
            },
        );

        it(
            'rejects login when username is missing',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/login',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        body: {
                            password:
                                'password',
                        },
                    },
                    reply,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,
                    message:
                        'Username and password are required',
                });

                expect(
                    adminService
                        .validateCredentials,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'rejects login when password is missing',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/login',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        body: {
                            username:
                                'admin',
                        },
                    },
                    reply,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,
                    message:
                        'Username and password are required',
                });

                expect(
                    adminService
                        .validateCredentials,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'rejects login when both credentials are missing',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/login',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        body: {},
                    },
                    reply,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,
                    message:
                        'Username and password are required',
                });
            },
        );

        it(
            'authenticates valid credentials and sets the session cookie',
            async () => {
                vi.mocked(
                    adminService
                        .validateCredentials,
                ).mockResolvedValue(
                    {
                        _id:
                            'admin-id',
                        username:
                            'admin',
                    } as never,
                );

                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/login',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        body: {
                            username:
                                'admin',
                            password:
                                'password',
                        },
                    },
                    reply,
                );

                expect(
                    adminService
                        .validateCredentials,
                ).toHaveBeenCalledWith(
                    'admin',
                    'password',
                );

                expect(
                    sign,
                ).toHaveBeenCalledWith({
                    id:
                        'admin-id',
                    username:
                        'admin',
                    role:
                        'admin',
                });

                expect(
                    setCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    'signed-test-token',
                    expect.objectContaining(
                        {
                            path: '/',
                            httpOnly:
                                true,
                        },
                    ),
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        true,
                    message:
                        'Authentication successful',
                });
            },
        );

        it(
            'propagates authentication errors',
            async () => {
                vi.mocked(
                    adminService
                        .validateCredentials,
                ).mockRejectedValue(
                    new Error(
                        'Invalid credentials',
                    ),
                );

                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/login',
                    );

                const reply =
                    createReply();

                await expect(
                    route.handler?.(
                        {
                            body: {
                                username:
                                    'admin',
                                password:
                                    'wrong',
                            },
                        },
                        reply,
                    ),
                ).rejects.toThrow(
                    'Invalid credentials',
                );

                expect(
                    setCookie,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'logs out in production',
            async () => {
                process.env.NODE_ENV =
                    'production';

                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/logout',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {},
                    reply,
                );

                expect(
                    clearCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    expect.objectContaining(
                        {
                            path: '/',
                            httpOnly:
                                true,
                            secure:
                                true,
                        },
                    ),
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        true,
                    message:
                        'Logged out successfully',
                });
            },
        );

        it(
            'logs out outside production without a secure cookie',
            async () => {
                process.env.NODE_ENV =
                    'test';

                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'POST',
                        '/logout',
                    );

                const reply =
                    createReply();

                await route.handler?.(
                    {},
                    reply,
                );

                expect(
                    clearCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    expect.objectContaining(
                        {
                            path: '/',
                            httpOnly:
                                true,
                            secure:
                                false,
                        },
                    ),
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        true,
                    message:
                        'Logged out successfully',
                });
            },
        );

        it(
            'returns the authenticated administrator from /me',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'GET',
                        '/me',
                    );

                const jwtVerify =
                    vi.fn()
                        .mockResolvedValue(
                            {
                                id:
                                    'admin-id',
                                username:
                                    'admin',
                                role:
                                    'admin',
                            },
                        );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        jwtVerify,
                    },
                    reply,
                );

                expect(
                    jwtVerify,
                ).toHaveBeenCalled();

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith(
                    expect.objectContaining(
                        {
                            success:
                                true,
                            user:
                                expect.objectContaining(
                                    {
                                        id:
                                            'admin-id',
                                        username:
                                            'admin',
                                        role:
                                            'admin',
                                    },
                                ),
                        },
                    ),
                );
            },
        );

        it(
            'rejects /me when JWT verification fails',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'GET',
                        '/me',
                    );

                const jwtVerify =
                    vi.fn()
                        .mockRejectedValue(
                            new Error(
                                'Unauthorized',
                            ),
                        );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        jwtVerify,
                    },
                    reply,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    401,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,
                    message:
                        'Authentication required',
                });
            },
        );

        it(
            'rejects /me when the token is not an admin token',
            async () => {
                await authRoutes(
                    fastify,
                );

                const route =
                    findRoute(
                        'GET',
                        '/me',
                    );

                const jwtVerify =
                    vi.fn()
                        .mockResolvedValue(
                            {
                                id:
                                    'user-id',
                                username:
                                    'user',
                                role:
                                    'user',
                            },
                        );

                const reply =
                    createReply();

                await route.handler?.(
                    {
                        jwtVerify,
                    },
                    reply,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    403,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,
                    message:
                        'Admin access required',
                });
            },
        );
    },
);