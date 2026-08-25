import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    DatabaseError,
} from '../../src/errors/AppError';

describe(
    'AppError hierarchy',
    () => {
        it(
            'creates AppError with defaults',
            () => {
                const error =
                    new AppError(
                        'Internal failure',
                    );

                expect(error)
                    .toBeInstanceOf(
                        Error,
                    );

                expect(
                    error.message,
                ).toBe(
                    'Internal failure',
                );

                expect(
                    error.statusCode,
                ).toBe(500);

                expect(
                    error.code,
                ).toBe(
                    'INTERNAL_ERROR',
                );

                expect(
                    error.stack,
                ).toBeDefined();
            },
        );

        it(
            'creates AppError with custom status and code',
            () => {
                const error =
                    new AppError(
                        'Custom',
                        418,
                        'TEAPOT',
                    );

                expect(
                    error.statusCode,
                ).toBe(418);

                expect(
                    error.code,
                ).toBe('TEAPOT');
            },
        );

        it(
            'creates NotFoundError',
            () => {
                const error =
                    new NotFoundError(
                        'Project',
                    );

                expect(
                    error.statusCode,
                ).toBe(404);

                expect(
                    error.code,
                ).toBe(
                    'NOT_FOUND',
                );

                expect(
                    error.message,
                ).toBe(
                    'Project not found',
                );
            },
        );

        it(
            'creates ValidationError',
            () => {
                const error =
                    new ValidationError(
                        'Invalid field',
                    );

                expect(
                    error.statusCode,
                ).toBe(400);

                expect(
                    error.code,
                ).toBe(
                    'VALIDATION_ERROR',
                );
            },
        );

        it(
            'creates UnauthorizedError with default message',
            () => {
                const error =
                    new UnauthorizedError();

                expect(
                    error.statusCode,
                ).toBe(401);

                expect(
                    error.code,
                ).toBe(
                    'UNAUTHORIZED',
                );

                expect(
                    error.message,
                ).toBe(
                    'Unauthorized',
                );
            },
        );

        it(
            'creates UnauthorizedError with custom message',
            () => {
                const error =
                    new UnauthorizedError(
                        'Token expired',
                    );

                expect(
                    error.message,
                ).toBe(
                    'Token expired',
                );
            },
        );

        it(
            'creates ForbiddenError with default message',
            () => {
                const error =
                    new ForbiddenError();

                expect(
                    error.statusCode,
                ).toBe(403);

                expect(
                    error.code,
                ).toBe(
                    'FORBIDDEN',
                );

                expect(
                    error.message,
                ).toBe(
                    'Forbidden',
                );
            },
        );

        it(
            'creates ConflictError',
            () => {
                const error =
                    new ConflictError(
                        'Already exists',
                    );

                expect(
                    error.statusCode,
                ).toBe(409);

                expect(
                    error.code,
                ).toBe(
                    'CONFLICT',
                );
            },
        );

        it(
            'creates DatabaseError with default message',
            () => {
                const error =
                    new DatabaseError();

                expect(
                    error.statusCode,
                ).toBe(500);

                expect(
                    error.code,
                ).toBe(
                    'DATABASE_ERROR',
                );

                expect(
                    error.message,
                ).toBe(
                    'Database error',
                );
            },
        );

        it(
            'creates DatabaseError with custom message',
            () => {
                const error =
                    new DatabaseError(
                        'Mongo unavailable',
                    );

                expect(
                    error.message,
                ).toBe(
                    'Mongo unavailable',
                );
            },
        );

        it(
            'all specialized errors extend AppError',
            () => {
                expect(
                    new NotFoundError(
                        'x',
                    ),
                ).toBeInstanceOf(
                    AppError,
                );

                expect(
                    new ValidationError(
                        'x',
                    ),
                ).toBeInstanceOf(
                    AppError,
                );

                expect(
                    new UnauthorizedError(),
                ).toBeInstanceOf(
                    AppError,
                );

                expect(
                    new ForbiddenError(),
                ).toBeInstanceOf(
                    AppError,
                );

                expect(
                    new ConflictError(
                        'x',
                    ),
                ).toBeInstanceOf(
                    AppError,
                );

                expect(
                    new DatabaseError(),
                ).toBeInstanceOf(
                    AppError,
                );
            },
        );
    },
);