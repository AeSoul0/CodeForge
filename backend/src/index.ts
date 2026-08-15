/**
 * @file backend/src/index.ts
 * @description Main entry point for the Fastify server.
 *
 * Responsible for:
 * - Initializing the MongoDB connection.
 * - Registering security and infrastructure plugins.
 * - Registering API routes.
 * - Starting the HTTP server.
 */

import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';

import connectDB from './config/db';

import 'dotenv/config';

const app = fastify({
    logger: true,
});

/**
 * Starts the Fastify application.
 *
 * The startup sequence intentionally initializes the database
 * before registering the application routes so that API handlers
 * can safely access MongoDB when requests arrive.
 */
async function startServer(): Promise<void> {
    try {
        // ======================================================
        // 1. DATABASE
        // ======================================================

        /**
         * Establish the MongoDB connection before starting
         * the HTTP server.
         */
        await connectDB();

        // ======================================================
        // 2. SECURITY / MIDDLEWARES
        // ======================================================

        /**
         * Adds common security-related HTTP headers.
         */
        await app.register(helmet, {
            global: true,
        });

        /**
         * Protects the API against excessive request rates.
         */
        await app.register(rateLimit, {
            max: 100,
            timeWindow: '1 minute',

            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message:
                    'Rate limit exceeded. Please try again later.',
            }),
        });

        /**
         * Resolve the allowed frontend origin from the environment.
         *
         * Local development origins remain available as fallbacks.
         */
        const frontendUrl =
            process.env.FRONTEND_URL ||
            'http://localhost:4321';

        const allowedOrigins = [
            frontendUrl,
            'http://localhost:4321',
            'http://127.0.0.1:4321',
        ].filter(
            (origin, index, array) =>
                array.indexOf(origin) === index,
        );

        /**
         * Configure CORS for browser-based API requests.
         */
        await app.register(cors, {
            origin: allowedOrigins,
            methods: [
                'GET',
                'POST',
                'PUT',
                'DELETE',
            ],
        });

        // ======================================================
        // 3. GLOBAL ERROR HANDLER
        // ======================================================

        /**
         * Centralized error handler used by all API routes.
         *
         * Production responses intentionally hide stack traces
         * and internal error details.
         */
        app.setErrorHandler(
            (error: any, request, reply) => {
                request.log.error(error);

                const statusCode =
                    error.statusCode || 500;

                const isProduction =
                    process.env.NODE_ENV ===
                    'production';

                reply.status(statusCode).send({
                    success: false,
                    statusCode,

                    error:
                        statusCode === 404
                            ? 'Not Found'
                            : 'Internal Server Error',

                    message:
                        statusCode === 500 &&
                            isProduction
                            ? 'An unexpected error occurred on the server.'
                            : error.message,

                    ...(isProduction
                        ? {}
                        : {
                            stack: error.stack,
                        }),
                });
            },
        );

        // ======================================================
        // 4. API ROUTES
        // ======================================================

        /**
         * Public and protected project endpoints.
         *
         * Full route:
         * /api/projects
         */
        await app.register(projectRoutes, {
            prefix: '/api/projects',
        });

        /**
         * Public and protected experience endpoints.
         *
         * Full route:
         * /api/experiences
         */
        await app.register(experienceRoutes, {
            prefix: '/api/experiences',
        });

        /**
         * Lightweight health endpoint used by the deployment
         * platform and monitoring systems.
         */
        app.get('/api/health', async () => {
            return {
                status: 'ok',
                uptime: process.uptime(),
            };
        });

        // ======================================================
        // 5. SERVER
        // ======================================================

        /**
         * Render provides PORT automatically in production.
         * Port 3002 is used as the local development fallback.
         */
        const port = Number(
            process.env.PORT || 3002,
        );

        /**
         * Bind to all interfaces so the application is reachable
         * from containerized and hosted environments.
         */
        await app.listen({
            port,
            host: '0.0.0.0',
        });

        console.log(
            `🚀 CodeForge Backend locked and loaded on port ${port}`,
        );
    } catch (error) {
        /**
         * Startup failures are fatal because the application
         * cannot operate correctly without its infrastructure.
         */
        app.log.error(error);
        process.exit(1);
    }
}

void startServer();