/**
 * @file backend/src/index.ts
 * @description CodeForge backend runtime entry point.
 *
 * Responsibilities:
 * - Establish the MongoDB connection.
 * - Seed the initial administrator account.
 * - Start the configured Fastify application.
 * - Run background AI enrichment tasks.
 * - Handle graceful shutdown.
 *
 * Application configuration and route registration are intentionally kept
 * in app.ts so integration tests can use the same configured Fastify
 * application without starting an HTTP server.
 */

import mongoose from 'mongoose';

import app, {
    appInitialization,
} from './app';

import connectDB from './config/db';
import { seedAdmin } from './utils/seedAdmin';

import {
    generateMissingProjectDescriptions,
} from './utils/ai';

/**
 * Start the CodeForge backend server.
 *
 * Database initialization is deliberately kept here rather than inside
 * app.ts because tests should be able to import the configured application
 * without connecting to production infrastructure.
 */
async function startServer(): Promise<void> {
    try {
        // ============================================================
        // 1. DATABASE
        // ============================================================

        await connectDB();

        await seedAdmin();

        // ============================================================
        // 2. APPLICATION CONFIGURATION
        // ============================================================

        /**
         * Wait until all Fastify plugins, middleware and routes have been
         * registered before opening the HTTP server.
         */
        await appInitialization;

        // ============================================================
        // 3. HTTP SERVER
        // ============================================================

        const port = Number(
            process.env.PORT || 3002,
        );

        await app.listen({
            port,
            host: '0.0.0.0',
        });

        app.log.info(
            `🚀 CodeForge Backend is running on port ${port}`,
        );

        // ============================================================
        // 4. AI BACKGROUND TASKS
        // ============================================================

        /**
         * Run the missing-description scan after the HTTP server becomes
         * available so startup is not blocked by optional AI enrichment.
         *
         * Projects with an existing description are skipped by the
         * generation utility.
         */
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
 * Gracefully close the Fastify server and MongoDB connection.
 */
const closeGracefully = async (
    signal: string,
): Promise<void> => {
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
};

process.on('SIGINT', () => {
    void closeGracefully('SIGINT');
});

process.on('SIGTERM', () => {
    void closeGracefully('SIGTERM');
});

/**
 * Start the real HTTP server only outside the test environment.
 *
 * Integration tests import app.ts and use app.ready()/app.inject() without
 * opening a network port or running the production bootstrap.
 */
if (
    process.env.NODE_ENV !== 'test'
) {
    void startServer();
}

export default app;