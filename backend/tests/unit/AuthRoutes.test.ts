import {
    beforeEach,
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const {
    validateCredentialsMock,
} = vi.hoisted(() => ({
    validateCredentialsMock:
        vi.fn(),
}));

vi.mock(
    '../../src/services/AdminService',
    () => ({
        adminService: {
            validateCredentials:
                validateCredentialsMock,
        },
    }),
);

import authRoutes from '../../src/routes/authRoutes';

type RegisteredRoute = {
    method: string;

    url: string;

    options?: Record<
        string,
        unknown
    >;

    handler: (
        request: unknown,
        reply: unknown,
    ) => unknown;
};

function createFastifyMock() {
    const routes:
        RegisteredRoute[] = [];

    const fastify = {
        post: vi.fn(
            (
                url: string,

                optionsOrHandler:
                    | Record<
                        string,
                        unknown
                    >
                    | ((
                        request:
                            unknown,
                        reply:
                            unknown,
                    ) => unknown),

                maybeHandler?: (
                    request:
                        unknown,
                    reply:
                        unknown,
                ) => unknown,
            ) => {
                if (
                    typeof optionsOrHandler ===
                    'function'
                ) {
                    routes.push({
                        method:
                            'POST',

                        url,

                        handler:
                            optionsOrHandler,
                    });

                    return;
                }

                routes.push({
                    method:
                        'POST',

                    url,

                    options:
                        optionsOrHandler,

                    handler:
                        maybeHandler!,
                });
            },
        ),

        jwt: {
            sign:
                vi.fn(),
        },
    };

    return {
        fastify,
        routes,
    };
}

function createReplyMock() {
    const reply = {
        status:
            vi.fn(),

        send:
            vi.fn(),

        setCookie:
            vi.fn(),

        clearCookie:
            vi.fn(),
    };

    reply.status.mockReturnValue(
        reply,
    );

    return reply;
}

function getRoute(
    routes: RegisteredRoute[],
    url: string,
) {
    const route =
        routes.find(
            (entry) =>
                entry.url ===
                    url,
        );

    if (!route) {
        throw new Error(
            `Missing route: ${url}`,
        );
    }

    return route;
}

describe(
    'authRoutes',
    () => {
        const originalNodeEnv =
            process.env.NODE_ENV;

        let fastify: ReturnType<
            typeof createFastifyMock
        >;

        let routes:
            RegisteredRoute[];

        beforeEach(
            async () => {
                vi.clearAllMocks();

                fastify =
                    createFastifyMock();

                routes =
                    fastify.routes;

                await authRoutes(
                    fastify.fastify as never,
                );
            },
        );

        afterEach(() => {
            process.env.NODE_ENV =
                originalNodeEnv;
        });

        it(
            'registers login and logout routes',
            () => {
                expect(routes).toHaveLength(
                    2,
                );

                expect(
                    getRoute(
                        routes,
                        '/login',
                    ).method,
                ).toBe(
                    'POST',
                );

                expect(
                    getRoute(
                        routes,
                        '/logout',
                    ).method,
                ).toBe(
                    'POST',
                );
            },
        );

        it(
            'rejects login when username is missing',
            async () => {
                const route =
                    getRoute(
                        routes,
                        '/login',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        body: {
                            password:
                                'password',
                        },
                    },
                    reply,
                );

                expect(
                    validateCredentialsMock,
                ).not.toHaveBeenCalled();

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
            'rejects login when password is missing',
            async () => {
                const route =
                    getRoute(
                        routes,
                        '/login',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        body: {
                            username:
                                'admin',
                        },
                    },
                    reply,
                );

                expect(
                    validateCredentialsMock,
                ).not.toHaveBeenCalled();

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    400,
                );
            },
        );

        it(
            'rejects login when both credentials are missing',
            async () => {
                const route =
                    getRoute(
                        routes,
                        '/login',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
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
            'authenticates valid credentials and sets secure cookie',
            async () => {
                const route =
                    getRoute(
                        routes,
                        '/login',
                    );

                const reply =
                    createReplyMock();

                const admin = {
                    _id:
                        'admin-id',

                    username:
                        'admin',
                };

                validateCredentialsMock
                    .mockResolvedValue(
                        admin,
                    );

                fastify.fastify.jwt.sign
                    .mockReturnValue(
                        'jwt-token',
                    );

                const request = {
                    body: {
                        username:
                            'admin',

                        password:
                            'password',
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    validateCredentialsMock,
                ).toHaveBeenCalledWith(
                    'admin',
                    'password',
                );

                expect(
                    fastify.fastify.jwt
                        .sign,
                ).toHaveBeenCalledWith({
                    id:
                        'admin-id',

                    username:
                        'admin',

                    role:
                        'admin',
                });

                expect(
                    reply.setCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    'jwt-token',
                    expect.objectContaining({
                        path:
                            '/',

                        httpOnly:
                            true,

                        secure:
                            true,

                        sameSite:
                            'strict',
                    }),
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
                const route =
                    getRoute(
                        routes,
                        '/login',
                    );

                validateCredentialsMock
                    .mockRejectedValue(
                        new Error(
                            'invalid credentials',
                        ),
                    );

                await expect(
                    route.handler(
                        {
                            body: {
                                username:
                                    'admin',

                                password:
                                    'wrong',
                            },
                        },
                        createReplyMock(),
                    ),
                ).rejects.toThrow(
                    'invalid credentials',
                );
            },
        );

        it(
            'logs out in production with secure cookie options',
            async () => {
                process.env.NODE_ENV =
                    'production';

                const route =
                    getRoute(
                        routes,
                        '/logout',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {},
                    reply,
                );

                expect(
                    reply.clearCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    {
                        path:
                            '/',

                        httpOnly:
                            true,

                        secure:
                            true,

                        sameSite:
                            'strict',
                    },
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
            'logs out outside production without secure cookie',
            async () => {
                process.env.NODE_ENV =
                    'test';

                const route =
                    getRoute(
                        routes,
                        '/logout',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {},
                    reply,
                );

                expect(
                    reply.clearCookie,
                ).toHaveBeenCalledWith(
                    'token',
                    {
                        path:
                            '/',

                        httpOnly:
                            true,

                        secure:
                            false,

                        sameSite:
                            'strict',
                    },
                );
            },
        );
    },
);