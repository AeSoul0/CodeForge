import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const {
    mongooseMock,
    experienceModelMock,
    authenticateAdminMock,
    controllersMock,
} = vi.hoisted(() => ({
    mongooseMock: {
        isValidObjectId:
            vi.fn(),
    },

    experienceModelMock: {
        findOne:
            vi.fn(),
    },

    authenticateAdminMock:
        vi.fn(),

    controllersMock: {
        getExperiences:
            vi.fn(),

        createExperience:
            vi.fn(),

        updateExperience:
            vi.fn(),

        deleteExperience:
            vi.fn(),
    },
}));

vi.mock(
    'mongoose',
    () => ({
        default:
            mongooseMock,
    }),
);

vi.mock(
    '../../src/models/Experiences',
    () => ({
        default:
            experienceModelMock,
    }),
);

vi.mock(
    '../../src/middlewares/auth',
    () => ({
        authenticateAdmin:
            authenticateAdminMock,
    }),
);

vi.mock(
    '../../src/controllers/experienceController',
    () => controllersMock,
);

import experienceRoutes from '../../src/routes/experienceRoutes';

type RegisteredRoute = {
    method: string;
    url: string;
    options?: Record<string, unknown>;
    handler: (
        request: unknown,
        reply: unknown,
    ) => unknown;
};

function createFastifyMock() {
    const routes: RegisteredRoute[] = [];

    const fastify = {
        get: vi.fn(
            (
                url: string,
                optionsOrHandler:
                    | Record<string, unknown>
                    | ((
                        request: unknown,
                        reply: unknown,
                    ) => unknown),
                maybeHandler?: (
                    request: unknown,
                    reply: unknown,
                ) => unknown,
            ) => {
                if (
                    typeof optionsOrHandler ===
                    'function'
                ) {
                    routes.push({
                        method:
                            'GET',

                        url,

                        handler:
                            optionsOrHandler,
                    });

                    return;
                }

                routes.push({
                    method:
                        'GET',

                    url,

                    options:
                        optionsOrHandler,

                    handler:
                        maybeHandler!,
                });
            },
        ),

        post: vi.fn(
            (
                url: string,
                options: Record<string, unknown>,
                handler: (
                    request: unknown,
                    reply: unknown,
                ) => unknown,
            ) => {
                routes.push({
                    method:
                        'POST',

                    url,

                    options,

                    handler,
                });
            },
        ),

        patch: vi.fn(
            (
                url: string,
                options: Record<string, unknown>,
                handler: (
                    request: unknown,
                    reply: unknown,
                ) => unknown,
            ) => {
                routes.push({
                    method:
                        'PATCH',

                    url,

                    options,

                    handler,
                });
            },
        ),

        delete: vi.fn(
            (
                url: string,
                options: Record<string, unknown>,
                handler: (
                    request: unknown,
                    reply: unknown,
                ) => unknown,
            ) => {
                routes.push({
                    method:
                        'DELETE',

                    url,

                    options,

                    handler,
                });
            },
        ),
    };

    return {
        fastify,
        routes,
    };
}

function createReplyMock() {
    const reply = {
        code:
            vi.fn(),

        status:
            vi.fn(),

        send:
            vi.fn(),

        type:
            vi.fn(),

        header:
            vi.fn(),
    };

    reply.code.mockReturnValue(
        reply,
    );

    reply.status.mockReturnValue(
        reply,
    );

    reply.type.mockReturnValue(
        reply,
    );

    reply.header.mockReturnValue(
        reply,
    );

    return reply;
}

function createExperience(
    overrides: Record<
        string,
        unknown
    > = {},
) {
    return {
        _id: {
            toString:
                () =>
                    '507f1f77bcf86cd799439011',
        },

        company:
            'CodeForge',

        image:
            null,

        imageData:
            null,

        imageMimeType:
            null,

        imageFileName:
            null,

        save:
            vi.fn()
                .mockResolvedValue(
                    undefined,
                ),

        ...overrides,
    };
}

function getRoute(
    routes: RegisteredRoute[],
    method: string,
    url: string,
) {
    const route =
        routes.find(
            (item) =>
                item.method ===
                    method &&
                item.url === url,
        );

    if (!route) {
        throw new Error(
            `Route not registered: ${method} ${url}`,
        );
    }

    return route;
}

describe(
    'experienceRoutes',
    () => {
        let routes: RegisteredRoute[];

        beforeEach(
            async () => {
                vi.clearAllMocks();

                mongooseMock
                    .isValidObjectId
                    .mockReturnValue(
                        false,
                    );

                experienceModelMock
                    .findOne
                    .mockReset();

                const result =
                    createFastifyMock();

                routes =
                    result.routes;

                await experienceRoutes(
                    result.fastify as never,
                );
            },
        );

        it(
            'registers all experience routes',
            () => {
                expect(routes).toHaveLength(
                    6,
                );

                expect(
                    getRoute(
                        routes,
                        'GET',
                        '/',
                    ),
                ).toBeDefined();

                expect(
                    getRoute(
                        routes,
                        'POST',
                        '/',
                    ),
                ).toBeDefined();

                expect(
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name',
                    ),
                ).toBeDefined();

                expect(
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    ),
                ).toBeDefined();

                expect(
                    getRoute(
                        routes,
                        'GET',
                        '/:name/image',
                    ),
                ).toBeDefined();

                expect(
                    getRoute(
                        routes,
                        'DELETE',
                        '/:name',
                    ),
                ).toBeDefined();
            },
        );

        it(
            'registers GET experiences without authentication',
            () => {
                const route =
                    getRoute(
                        routes,
                        'GET',
                        '/',
                    );

                expect(
                    route.handler,
                ).toBe(
                    controllersMock
                        .getExperiences,
                );

                expect(
                    route.options,
                ).toBeUndefined();
            },
        );

        it(
            'registers POST experiences with admin authentication',
            () => {
                const route =
                    getRoute(
                        routes,
                        'POST',
                        '/',
                    );

                expect(
                    route.handler,
                ).toBe(
                    controllersMock
                        .createExperience,
                );

                expect(
                    route.options,
                ).toEqual(
                    expect.objectContaining({
                        preHandler:
                            [
                                authenticateAdminMock,
                            ],
                    }),
                );
            },
        );

        it(
            'registers PATCH experiences with admin authentication',
            () => {
                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name',
                    );

                expect(
                    route.handler,
                ).toBe(
                    controllersMock
                        .updateExperience,
                );

                expect(
                    route.options,
                ).toEqual(
                    expect.objectContaining({
                        preHandler:
                            [
                                authenticateAdminMock,
                            ],
                    }),
                );
            },
        );

        it(
            'registers DELETE experiences with admin authentication',
            () => {
                const route =
                    getRoute(
                        routes,
                        'DELETE',
                        '/:name',
                    );

                expect(
                    route.handler,
                ).toBe(
                    controllersMock
                        .deleteExperience,
                );

                expect(
                    route.options,
                ).toEqual(
                    expect.objectContaining({
                        preHandler:
                            [
                                authenticateAdminMock,
                            ],
                    }),
                );
            },
        );

        it(
            'returns 404 when image target does not exist',
            async () => {
                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        null,
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'Unknown Company',
                    },

                    body: {
                        image:
                            'data:image/png;base64,aGVsbG8=',
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    experienceModelMock
                        .findOne,
                ).toHaveBeenCalledWith({
                    company:
                        'Unknown Company',
                });

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    404,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Experience not found.',
                });
            },
        );

        it(
            'uses _id when image route receives a valid ObjectId',
            async () => {
                mongooseMock
                    .isValidObjectId
                    .mockReturnValue(
                        true,
                    );

                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            '507f1f77bcf86cd799439011',
                    },

                    body: {
                        image:
                            null,
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    experienceModelMock
                        .findOne,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });
            },
        );

        it(
            'removes an existing image when image is null',
            async () => {
                const experience =
                    createExperience({
                        image:
                            '/old-image.png',

                        imageData:
                            Buffer.from(
                                'old',
                            ),

                        imageMimeType:
                            'image/png',

                        imageFileName:
                            'old.png',
                    });

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'CodeForge',
                    },

                    body: {
                        image:
                            null,
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    experience.image,
                ).toBeNull();

                expect(
                    experience.imageData,
                ).toBeNull();

                expect(
                    experience.imageMimeType,
                ).toBeNull();

                expect(
                    experience.imageFileName,
                ).toBeNull();

                expect(
                    experience.save,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    data: {
                        id:
                            '507f1f77bcf86cd799439011',

                        image:
                            null,
                    },
                });
            },
        );

        it(
            'rejects invalid image data URI',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'CodeForge',
                    },

                    body: {
                        image:
                            'not-a-data-uri',
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    request.log.error,
                ).toHaveBeenCalled();

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Invalid image format. Expected a Base64 data URI such as data:image/jpeg;base64,...',
                });
            },
        );

        it(
            'rejects unsupported image MIME type',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'CodeForge',
                    },

                    body: {
                        image:
                            'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==',
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Unsupported image type. Allowed types: JPEG, PNG, WEBP.',
                });
            },
        );

        it(
            'rejects empty decoded image payload',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'CodeForge',
                    },

                    body: {
                        image:
                            'data:image/png;base64,',
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    400,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Invalid image format. Expected a Base64 data URI such as data:image/jpeg;base64,...',
                });
            },
        );

        it(
            'stores a valid PNG image',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                const request = {
                    params: {
                        name:
                            'CodeForge',
                    },

                    body: {
                        image:
                            'data:image/png;base64,aGVsbG8=',
                    },

                    log: {
                        error:
                            vi.fn(),
                    },
                };

                await route.handler(
                    request,
                    reply,
                );

                expect(
                    experience.imageData,
                ).toEqual(
                    Buffer.from(
                        'hello',
                    ),
                );

                expect(
                    experience.imageMimeType,
                ).toBe(
                    'image/png',
                );

                expect(
                    experience.imageFileName,
                ).toBe(
                    'experience.png',
                );

                expect(
                    experience.image,
                ).toBe(
                    '/api/experiences/507f1f77bcf86cd799439011/image',
                );

                expect(
                    experience.save,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        true,

                    data: {
                        id:
                            '507f1f77bcf86cd799439011',

                        image:
                            '/api/experiences/507f1f77bcf86cd799439011/image',

                        mimeType:
                            'image/png',

                        size:
                            5,
                    },
                });
            },
        );

        it(
            'stores JPEG with the correct filename',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        params: {
                            name:
                                'CodeForge',
                        },

                        body: {
                            image:
                                'data:image/jpeg;base64,aGVsbG8=',
                        },

                        log: {
                            error:
                                vi.fn(),
                        },
                    },
                    reply,
                );

                expect(
                    experience.imageMimeType,
                ).toBe(
                    'image/jpeg',
                );

                expect(
                    experience.imageFileName,
                ).toBe(
                    'experience.jpg',
                );
            },
        );

        it(
            'stores WEBP with the correct filename',
            async () => {
                const experience =
                    createExperience();

                experienceModelMock
                    .findOne
                    .mockResolvedValue(
                        experience,
                    );

                const route =
                    getRoute(
                        routes,
                        'PATCH',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        params: {
                            name:
                                'CodeForge',
                        },

                        body: {
                            image:
                                'data:image/webp;base64,aGVsbG8=',
                        },

                        log: {
                            error:
                                vi.fn(),
                        },
                    },
                    reply,
                );

                expect(
                    experience.imageMimeType,
                ).toBe(
                    'image/webp',
                );

                expect(
                    experience.imageFileName,
                ).toBe(
                    'experience.webp',
                );
            },
        );

        it(
            'returns 404 when GET image target does not exist',
            async () => {
                const select =
                    vi.fn();

                select.mockResolvedValue(
                    null,
                );

                experienceModelMock
                    .findOne
                    .mockReturnValue({
                        select,
                    });

                const route =
                    getRoute(
                        routes,
                        'GET',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        params: {
                            name:
                                'Unknown',
                        },
                    },
                    reply,
                );

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    404,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Experience not found.',
                });
            },
        );

        it(
            'returns 404 when GET image has no stored image',
            async () => {
                const select =
                    vi.fn()
                        .mockResolvedValue(
                            createExperience({
                                imageData:
                                    null,

                                imageMimeType:
                                    null,
                            }),
                        );

                experienceModelMock
                    .findOne
                    .mockReturnValue({
                        select,
                    });

                const route =
                    getRoute(
                        routes,
                        'GET',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        params: {
                            name:
                                'CodeForge',
                        },
                    },
                    reply,
                );

                expect(
                    reply.code,
                ).toHaveBeenCalledWith(
                    404,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    message:
                        'Experience image not found.',
                });
            },
        );

        it(
            'returns stored image with MIME type and cache headers',
            async () => {
                const imageData =
                    Buffer.from(
                        'image-data',
                    );

                const select =
                    vi.fn()
                        .mockResolvedValue(
                            createExperience({
                                imageData,

                                imageMimeType:
                                    'image/png',
                            }),
                        );

                experienceModelMock
                    .findOne
                    .mockReturnValue({
                        select,
                    });

                const route =
                    getRoute(
                        routes,
                        'GET',
                        '/:name/image',
                    );

                const reply =
                    createReplyMock();

                await route.handler(
                    {
                        params: {
                            name:
                                'CodeForge',
                        },
                    },
                    reply,
                );

                expect(
                    select,
                ).toHaveBeenCalledWith(
                    '+imageData +imageMimeType',
                );

                expect(
                    reply.type,
                ).toHaveBeenCalledWith(
                    'image/png',
                );

                expect(
                    reply.header,
                ).toHaveBeenCalledWith(
                    'Cache-Control',
                    'public, max-age=3600, stale-while-revalidate=86400',
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith(
                    imageData,
                );
            },
        );

        it(
            'GET image uses _id for valid ObjectId',
            async () => {
                mongooseMock
                    .isValidObjectId
                    .mockReturnValue(
                        true,
                    );

                const select =
                    vi.fn()
                        .mockResolvedValue(
                            createExperience({
                                imageData:
                                    Buffer.from(
                                        'data',
                                    ),

                                imageMimeType:
                                    'image/webp',
                            }),
                        );

                experienceModelMock
                    .findOne
                    .mockReturnValue({
                        select,
                    });

                const route =
                    getRoute(
                        routes,
                        'GET',
                        '/:name/image',
                    );

                await route.handler(
                    {
                        params: {
                            name:
                                '507f1f77bcf86cd799439011',
                        },
                    },
                    createReplyMock(),
                );

                expect(
                    experienceModelMock
                        .findOne,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });
            },
        );
    },
);