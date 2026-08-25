import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const {
    findByUsernameMock,
    compareMock,
} = vi.hoisted(() => ({
    findByUsernameMock:
        vi.fn(),

    compareMock:
        vi.fn(),
}));

vi.mock(
    '../../src/repositories/AdminRepository',
    () => ({
        adminRepository: {
            findByUsername:
                findByUsernameMock,
        },
    }),
);

vi.mock(
    'bcrypt',
    () => ({
        default: {
            compare:
                compareMock,
        },
    }),
);

import {
    AdminService,
} from '../../src/services/AdminService';

import {
    UnauthorizedError,
} from '../../src/errors/AppError';

describe(
    'AdminService',
    () => {
        let service: AdminService;

        beforeEach(() => {
            vi.clearAllMocks();

            service =
                new AdminService();
        });

        it(
            'returns admin when credentials are valid',
            async () => {
                const admin = {
                    _id:
                        'admin-id',

                    username:
                        'admin',

                    passwordHash:
                        'hashed-password',
                };

                findByUsernameMock
                    .mockResolvedValue(
                        admin,
                    );

                compareMock
                    .mockResolvedValue(
                        true,
                    );

                const result =
                    await service.validateCredentials(
                        'admin',
                        'password',
                    );

                expect(
                    findByUsernameMock,
                ).toHaveBeenCalledWith(
                    'admin',
                );

                expect(
                    compareMock,
                ).toHaveBeenCalledWith(
                    'password',
                    'hashed-password',
                );

                expect(result)
                    .toBe(admin);
            },
        );

        it(
            'throws UnauthorizedError when admin does not exist',
            async () => {
                findByUsernameMock
                    .mockResolvedValue(
                        null,
                    );

                await expect(
                    service.validateCredentials(
                        'missing',
                        'password',
                    ),
                ).rejects.toThrow(
                    UnauthorizedError,
                );

                expect(
                    compareMock,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'throws UnauthorizedError when password does not match',
            async () => {
                const admin = {
                    _id:
                        'admin-id',

                    username:
                        'admin',

                    passwordHash:
                        'hashed-password',
                };

                findByUsernameMock
                    .mockResolvedValue(
                        admin,
                    );

                compareMock
                    .mockResolvedValue(
                        false,
                    );

                await expect(
                    service.validateCredentials(
                        'admin',
                        'wrong-password',
                    ),
                ).rejects.toThrow(
                    UnauthorizedError,
                );

                expect(
                    compareMock,
                ).toHaveBeenCalledWith(
                    'wrong-password',
                    'hashed-password',
                );
            },
        );

        it(
            'propagates repository errors',
            async () => {
                findByUsernameMock
                    .mockRejectedValue(
                        new Error(
                            'database failure',
                        ),
                    );

                await expect(
                    service.validateCredentials(
                        'admin',
                        'password',
                    ),
                ).rejects.toThrow(
                    'database failure',
                );
            },
        );

        it(
            'propagates bcrypt errors',
            async () => {
                findByUsernameMock
                    .mockResolvedValue({
                        _id:
                            'admin-id',

                        username:
                            'admin',

                        passwordHash:
                            'hashed-password',
                    });

                compareMock
                    .mockRejectedValue(
                        new Error(
                            'bcrypt failure',
                        ),
                    );

                await expect(
                    service.validateCredentials(
                        'admin',
                        'password',
                    ),
                ).rejects.toThrow(
                    'bcrypt failure',
                );
            },
        );
    },
);