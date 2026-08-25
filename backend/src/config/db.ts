/**
 * @file backend/src/config/db.ts
 * @description MongoDB connection lifecycle management.
 *
 * Architecture Layer:
 * Infrastructure / Data Access
 *
 * Responsibility:
 * - Validate the MongoDB connection configuration.
 * - Establish the MongoDB connection.
 * - Retry transient connection failures.
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
 * Establish a connection to MongoDB.
 *
 * @param retries Number of attempts before failing.
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
             * These listeners are registered once after a successful
             * connection and remain active for the lifetime of the process.
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

            if (
                attemptsRemaining > 0
            ) {
                if (
                    process.env.NODE_ENV !==
                    'test'
                ) {
                    console.warn(
                        `MongoDB connection attempt ${attempt}/${retries} failed. Retrying in ${delay}ms.`,
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