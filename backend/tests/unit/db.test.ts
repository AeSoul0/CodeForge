/**
 * @file tests/unit/db.test.ts
 * @description Unit tests for the MongoDB connection lifecycle.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import connectDB from '../../src/config/db';

vi.mock(
    'mongoose',
    () => ({
        default: {
            connect:
                vi.fn(),

            connection: {
                on:
                    vi.fn(),
            },
        },
    }),
);

let mongoose: {
    connect: ReturnType<
        typeof vi.fn
    >;

    connection: {
        on: ReturnType<
            typeof vi.fn
        >;
    };
};

describe(
    'Database connection (db.ts)',
    () => {
        const originalEnv = {
            ...process.env,
        };

        const originalConsoleWarn =
            console.warn;

        const originalConsoleError =
            console.error;

        beforeEach(
            async () => {
                vi.clearAllMocks();

                process.env = {
                    ...originalEnv,
                };

                mongoose =
                    (
                        await import(
                            'mongoose'
                        )
                    ).default as unknown as typeof mongoose;

                /**
                 * Expected failure paths should not pollute test output.
                 * Production logging remains untouched.
                 */
                vi.spyOn(
                    console,
                    'warn',
                ).mockImplementation(
                    () => undefined,
                );

                vi.spyOn(
                    console,
                    'error',
                ).mockImplementation(
                    () => undefined,
                );
            },
        );

        afterEach(() => {
            process.env =
                originalEnv;

            console.warn =
                originalConsoleWarn;

            console.error =
                originalConsoleError;
        });

        it(
            'connects successfully with valid MONGODB_URI',
            async () => {
                process.env.MONGODB_URI =
                    'mongodb://localhost:27017/testdb';

                mongoose.connect.mockResolvedValue(
                    undefined,
                );

                await expect(
                    connectDB(
                        1,
                        0,
                    ),
                ).resolves.toBeUndefined();

                expect(
                    mongoose.connect,
                ).toHaveBeenCalledWith(
                    'mongodb://localhost:27017/testdb',
                    expect.objectContaining({
                        serverSelectionTimeoutMS:
                            5000,
                    }),
                );

                expect(
                    mongoose.connection.on,
                ).toHaveBeenCalledTimes(
                    2,
                );
            },
        );

        it(
            'throws when MONGODB_URI is missing',
            async () => {
                delete process.env
                    .MONGODB_URI;

                await expect(
                    connectDB(
                        1,
                        0,
                    ),
                ).rejects.toThrow(
                    'MONGODB_URI is strictly required but missing from environment variables.',
                );

                expect(
                    mongoose.connect,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'retries on connection failure and throws after final attempt',
            async () => {
                process.env.MONGODB_URI =
                    'mongodb://badhost:27017/testdb';

                const connectionError =
                    new Error(
                        'connection error',
                    );

                mongoose.connect.mockRejectedValue(
                    connectionError,
                );

                await expect(
                    connectDB(
                        2,
                        0,
                    ),
                ).rejects.toThrow(
                    'MongoDB connection failed after 2 attempt(s): connection error',
                );

                expect(
                    mongoose.connect,
                ).toHaveBeenCalledTimes(
                    2,
                );

                expect(
                    mongoose.connect,
                ).toHaveBeenNthCalledWith(
                    1,
                    'mongodb://badhost:27017/testdb',
                    expect.objectContaining({
                        serverSelectionTimeoutMS:
                            5000,
                    }),
                );

                expect(
                    mongoose.connect,
                ).toHaveBeenNthCalledWith(
                    2,
                    'mongodb://badhost:27017/testdb',
                    expect.objectContaining({
                        serverSelectionTimeoutMS:
                            5000,
                    }),
                );
            },
        );

        it(
            'succeeds when a retry eventually connects',
            async () => {
                process.env.MONGODB_URI =
                    'mongodb://localhost:27017/testdb';

                mongoose.connect
                    .mockRejectedValueOnce(
                        new Error(
                            'temporary connection error',
                        ),
                    )
                    .mockResolvedValueOnce(
                        undefined,
                    );

                await expect(
                    connectDB(
                        2,
                        0,
                    ),
                ).resolves.toBeUndefined();

                expect(
                    mongoose.connect,
                ).toHaveBeenCalledTimes(
                    2,
                );

                expect(
                    mongoose.connection.on,
                ).toHaveBeenCalledTimes(
                    2,
                );
            },
        );
    },
);