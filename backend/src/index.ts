/**
 * @file backend/src/index.ts
 * @description CodeForge backend runtime entry point.
 *
 * Responsibilities:
 * - Establish the MongoDB connection.
 * - Seed the initial administrator account.
 * - Initialize Fastify.
 * - Start the HTTP server in development/production.
 * - Start the real server explicitly for Playwright E2E.
 * - Never start an HTTP server during Vitest.
 * - Handle graceful shutdown.
 */

import mongoose from 'mongoose';

import app, {
    appInitialization,
} from './app';

import connectDB from './config/db';
import {
    seedAdmin,
} from './utils/seedAdmin';

import {
    generateMissingProjectDescriptions,
} from './utils/ai';

/**
 * Start the CodeForge backend.
 */
async function startServer(): Promise<void> {
    try {
        await connectDB();

        await seedAdmin();

        await appInitialization;

        const port =
            Number(
                process.env.PORT ?? 3002,
            );

        await app.listen({
            port,
            host: '0.0.0.0',
        });

        app.log.info(
            `🚀 CodeForge Backend is running on port ${port}`,
        );

        void generateMissingProjectDescriptions();
    } catch (error) {
        app.log.error(
            error,
            'Failed to start CodeForge backend.',
        );

        process.exit(1);
    }
}

/**
 * Gracefully shut down the application.
 */
async function closeGracefully(
    signal: string,
): Promise<void> {
    app.log.info(
        `Received shutdown signal: ${signal}`,
    );

    try {
        await app.close();

        app.log.info(
            'Fastify server closed successfully.',
        );

        await mongoose.disconnect();

        app.log.info(
            'MongoDB connection closed successfully.',
        );

        process.exit(0);
    } catch (error) {
        app.log.error(
            error,
            'Failed during graceful shutdown.',
        );

        process.exit(1);
    }
}

process.on(
    'SIGINT',
    () => {
        void closeGracefully(
            'SIGINT',
        );
    },
);

process.on(
    'SIGTERM',
    () => {
        void closeGracefully(
            'SIGTERM',
        );
    },
);

/**
 * Vitest exposes VITEST=true.
 *
 * This check takes precedence over E2E so that a stale E2E=true environment
 * variable cannot cause unit/integration tests to start an HTTP server.
 */
const isVitest =
    process.env.VITEST === 'true';

const isE2E =
    process.env.E2E === 'true';

/**
 * Start the HTTP server when:
 *
 * - not running under Vitest, and
 * - either NODE_ENV is not "test", or E2E=true.
 */
const shouldStartServer =
    !isVitest &&
    (
        process.env.NODE_ENV !==
            'test' ||
        isE2E
    );

if (shouldStartServer) {
    void startServer();
}

export default app;