import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const {
    bcryptMock,
    adminModelMock,
} = vi.hoisted(() => ({
    bcryptMock: {
        genSalt:
            vi.fn(),

        hash:
            vi.fn(),
    },

    adminModelMock: {
        countDocuments:
            vi.fn(),

        updateOne:
            vi.fn(),

        create:
            vi.fn(),
    },
}));

vi.mock(
    'bcrypt',
    () => ({
        default:
            bcryptMock,
    }),
);

vi.mock(
    '../../src/models/Admin',
    () => ({
        Admin:
            adminModelMock,
    }),
);

import {
    seedAdmin,
} from '../../src/utils/seedAdmin';

describe(
    'seedAdmin',
    () => {
        const originalApiKey =
            process.env
                .ADMIN_API_KEY;

        const originalLog =
            console.log;

        beforeEach(() => {
            vi.clearAllMocks();

            console.log =
                vi.fn();

            bcryptMock.genSalt
                .mockResolvedValue(
                    'salt',
                );

            bcryptMock.hash
                .mockResolvedValue(
                    'hashed-password',
                );

            adminModelMock
                .countDocuments
                .mockResolvedValue(
                    0,
                );

            adminModelMock.create
                .mockResolvedValue(
                    undefined,
                );

            adminModelMock.updateOne
                .mockResolvedValue(
                    undefined,
                );
        });

        afterEach(() => {
            process.env
                .ADMIN_API_KEY =
                originalApiKey;

            console.log =
                originalLog;

            vi.restoreAllMocks();
        });

        it(
            'throws when ADMIN_API_KEY is missing',
            async () => {
                delete process.env
                    .ADMIN_API_KEY;

                await expect(
                    seedAdmin(),
                ).rejects.toThrow(
                    'ADMIN_API_KEY is required to bootstrap or update the administrator account.',
                );

                expect(
                    bcryptMock.genSalt,
                ).not.toHaveBeenCalled();

                expect(
                    adminModelMock.create,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'updates existing admin password',
            async () => {
                process.env
                    .ADMIN_API_KEY =
                    'test-api-key';

                adminModelMock
                    .countDocuments
                    .mockResolvedValue(
                        1,
                    );

                await seedAdmin();

                expect(
                    bcryptMock.genSalt,
                ).toHaveBeenCalledWith(
                    10,
                );

                expect(
                    bcryptMock.hash,
                ).toHaveBeenCalledWith(
                    'test-api-key',
                    'salt',
                );

                expect(
                    adminModelMock.updateOne,
                ).toHaveBeenCalledWith(
                    {
                        username:
                            'admin',
                    },
                    {
                        passwordHash:
                            'hashed-password',
                    },
                );

                expect(
                    adminModelMock.create,
                ).not.toHaveBeenCalled();

                expect(
                    console.log,
                ).toHaveBeenCalledWith(
                    '✅ Admin password synchronized with environment variables.',
                );
            },
        );

        it(
            'creates admin when no admin exists',
            async () => {
                process.env
                    .ADMIN_API_KEY =
                    'test-api-key';

                adminModelMock
                    .countDocuments
                    .mockResolvedValue(
                        0,
                    );

                await seedAdmin();

                expect(
                    adminModelMock.create,
                ).toHaveBeenCalledWith({
                    username:
                        'admin',

                    passwordHash:
                        'hashed-password',
                });

                expect(
                    adminModelMock.updateOne,
                ).not.toHaveBeenCalled();

                expect(
                    console.log,
                ).toHaveBeenCalledWith(
                    '✅ Admin user seeded successfully.',
                );
            },
        );
    },
);