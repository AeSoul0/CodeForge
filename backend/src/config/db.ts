/**
 * @file backend/src/config/db.ts
 * @description MongoDB connection lifecycle management.
 *
 * Architecture Layer:
 * Infrastructure / Data Access
 *
 * Responsibilities:
 * - Validate MongoDB configuration.
 * - Establish the MongoDB connection.
 * - Retry transient connection failures.
 * - Provide useful diagnostics during E2E startup.
 * - Surface startup failures to the application bootstrap.
 *
 * Process termination is intentionally handled by index.ts rather than
 * this infrastructure module. This keeps the function testable and avoids
 * coupling database infrastructure to process lifecycle management.
 */

import mongoose from 'mongoose';

const DEFAULT_RETRIES = 5;
const DEFAULT_DELAY_MS = 5000;
const SERVER_SELECTION_TIMEOUT_MS = 5000;

/**
 * Return whether the process is running an end-to-end test.
 *
 * E2E runs use NODE_ENV=test but must provide production-like startup
 * diagnostics because Playwright starts the real backend process.
 */
const isE2EEnvironment = (): boolean =>
    process.env.E2E === 'true';

/**
 * Establish a connection to MongoDB.
 *
 * @param retries Number of connection attempts before failing.
 * @param delay Delay in milliseconds between attempts.
 * @throws Error when MongoDB configuration is missing or all attempts fail.
 */
const connectDB = async (
    retries: number = DEFAULT_RETRIES,
    delay: number = DEFAULT_DELAY_MS,
): Promise<void> => {
    if (retries < 1) {
        throw new Error(
            'MongoDB connection requires at least one attempt.',
        );
    }

    let lastError: unknown;

    for (
        let attempt = 1;
        attempt <= retries;
        attempt += 1
    ) {
        try {
            const mongoURI =
                process.env.MONGODB_URI?.trim();

            if (!mongoURI) {
                throw new Error(
                    'MONGODB_URI is strictly required but missing from environment variables.',
                );
            }

            await mongoose.connect(
                mongoURI,
                {
                    serverSelectionTimeoutMS:
                        SERVER_SELECTION_TIMEOUT_MS,
                },
            );

            console.log(
                '✅ MongoDB Cluster Connected Successfully',
            );

            /**
             * Handle post-connection events for resilience.
             *
             * These listeners remain active for the lifetime of the process.
             */
            mongoose.connection.on(
                'error',
                (error: unknown) => {
                    console.error(
                        '❌ MongoDB runtime error:',
                        error,
                    );
                },
            );

            mongoose.connection.on(
                'disconnected',
                () => {
                    console.warn(
                        '⚠️ MongoDB disconnected.',
                    );
                },
            );

            return;
        } catch (error) {
            lastError = error;

            const attemptsRemaining =
                retries - attempt;

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            /**
             * Test environments intentionally keep ordinary Vitest output
             * quiet. E2E is different because it starts the real server and
             * therefore needs actionable startup diagnostics.
             */
            if (
                process.env.NODE_ENV !== 'test' ||
                isE2EEnvironment()
            ) {
                console.warn(
                    `MongoDB connection attempt ${attempt}/${retries} failed.`,
                );

                if (isE2EEnvironment()) {
                    console.warn(
                        `MongoDB error: ${errorMessage}`,
                    );
                }
            }

            if (
                attemptsRemaining > 0
            ) {
                if (
                    process.env.NODE_ENV !== 'test' ||
                    isE2EEnvironment()
                ) {
                    console.warn(
                        `Retrying MongoDB connection in ${delay}ms.`,
                    );
                }

                await new Promise<void>(
                    (resolve) => {
                        setTimeout(
                            resolve,
                            delay,
                        );
                    },
                );

                continue;
            }
        }
    }

    const cause =
        lastError instanceof Error
            ? lastError.message
            : String(lastError);

    throw new Error(
        `MongoDB connection failed after ${retries} attempt(s): ${cause}`,
        {
            cause: lastError,
        },
    );
};

export default connectDB;