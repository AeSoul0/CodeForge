/**
 * @file backend/src/index.ts
 * @description Main entry point for the Fastify server.
 */

import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import projectRoutes from './routes/projectRoutes';
import connectDB from './config/db';

import 'dotenv/config';

const app = fastify({
    logger: true,
});

async function startServer(): Promise<void> {
    try {
        // ======================================================
        // 1. DATABASE
        // ======================================================

        await connectDB();

        // ======================================================
        // 2. SECURITY / MIDDLEWARES
        // ======================================================

        await app.register(helmet, {
            global: true,
        });

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

        /*
         * FRONTEND_URL should contain the production frontend URL
         * on Render. Localhost entries remain available for local
         * development.
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

        await app.register(projectRoutes, {
            prefix: '/api/projects',
        });

        /*
         * Render health check endpoint.
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

        /*
         * Render provides PORT automatically.
         * 3002 is used locally when PORT is not defined.
         */
        const port = Number(
            process.env.PORT || 3002,
        );

        /*
         * Render requires the service to listen on
         * 0.0.0.0 rather than localhost/127.0.0.1.
         */
        await app.listen({
            port,
            host: '0.0.0.0',
        });

        console.log(
            `🚀 CodeForge Backend locked and loaded on port ${port}`,
        );
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}

void startServer();