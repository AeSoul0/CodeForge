import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    globalErrorHandler,
} from '../../src/middlewares/errorHandler';

describe(
    'globalErrorHandler',
    () => {
        const originalNodeEnv =
            process.env.NODE_ENV;

        let request: {
            log: {
                error: ReturnType<
                    typeof vi.fn
                >;
            };
        };

        let reply: {
            status: ReturnType<
                typeof vi.fn
            >;

            send: ReturnType<
                typeof vi.fn
            >;
        };

        beforeEach(() => {
            vi.clearAllMocks();

            request = {
                log: {
                    error:
                        vi.fn(),
                },
            };

            reply = {
                status:
                    vi.fn()
                        .mockReturnThis(),

                send:
                    vi.fn()
                        .mockReturnThis(),
            };
        });

        it(
            'returns a 500 response in development with stack',
            () => {
                process.env.NODE_ENV =
                    'development';

                const error = {
                    statusCode:
                        500,
                    message:
                        'Database failed',
                    stack:
                        'Error: Database failed',
                } as never;

                globalErrorHandler(
                    error,
                    request as never,
                    reply as never,
                );

                expect(
                    request.log.error,
                ).toHaveBeenCalledWith(
                    error,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    500,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    statusCode:
                        500,

                    error:
                        'Internal Server Error',

                    message:
                        'Database failed',

                    stack:
                        'Error: Database failed',
                });
            },
        );

        it(
            'hides internal error details in production',
            () => {
                process.env.NODE_ENV =
                    'production';

                const error = {
                    statusCode:
                        500,
                    message:
                        'Sensitive database error',
                    stack:
                        'secret stack',
                } as never;

                globalErrorHandler(
                    error,
                    request as never,
                    reply as never,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    statusCode:
                        500,

                    error:
                        'Internal Server Error',

                    message:
                        'An unexpected error occurred on the server.',
                });
            },
        );

        it(
            'returns Not Found for 404 errors',
            () => {
                process.env.NODE_ENV =
                    'development';

                const error = {
                    statusCode:
                        404,
                    message:
                        'Route not found',
                    stack:
                        'stack',
                } as never;

                globalErrorHandler(
                    error,
                    request as never,
                    reply as never,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success:
                        false,

                    statusCode:
                        404,

                    error:
                        'Not Found',

                    message:
                        'Route not found',

                    stack:
                        'stack',
                });
            },
        );

        it(
            'defaults missing statusCode to 500',
            () => {
                process.env.NODE_ENV =
                    'development';

                const error = {
                    message:
                        'Unexpected failure',
                    stack:
                        'stack',
                } as never;

                globalErrorHandler(
                    error,
                    request as never,
                    reply as never,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    500,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        statusCode:
                            500,
                        error:
                            'Internal Server Error',
                    }),
                );
            },
        );

        it(
            'restores NODE_ENV after each test',
            () => {
                process.env.NODE_ENV =
                    originalNodeEnv;
            },
        );
    },
);