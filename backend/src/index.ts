/**
 * @file backend/src/index.ts
 * @description Main entry point for the CodeForge Fastify backend.
 *
 * Responsibilities:
 * - Load environment variables through DotenvX.
 * - Establish the MongoDB connection.
 * - Seed the administrator account.
 * - Register security and infrastructure plugins.
 * - Register API routes.
 * - Start the HTTP server.
 * - Run the one-time-safe AI description scan for existing projects.
 * - Handle graceful shutdown.
 */

import '@dotenvx/dotenvx/config';

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import mongoose from 'mongoose';

import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';
import healthRoutes from './routes/healthRoutes';
import { seedAdmin } from './utils/seedAdmin';
import { metricsHook } from './middleware/metrics';
import connectDB from './config/db';

import {
    generateMissingProjectDescriptions,
} from './utils/ai';

/**
 * Create the Fastify application instance.
 */
const app = fastify({
    logger: true,
    connectionTimeout: 10000,
    keepAliveTimeout: 5000,
});

/**
 * Start the CodeForge backend.
 */
async function startServer(): Promise<void> {
    try {
        // ============================================================
        // 1. DATABASE
        // ============================================================

        await connectDB();

        await seedAdmin();

        // ============================================================
        // 2. API DOCUMENTATION
        // ============================================================

        await app.register(swagger, {
            swagger: {
                info: {
                    title: 'CodeForge API',
                    description:
                        'API documentation for the CodeForge portfolio backend.',
                    version: '1.0.0',
                },

                host: 'localhost:3002',

                schemes: ['http', 'https'],

                consumes: ['application/json'],

                produces: ['application/json'],
            },
        });

        await app.register(swaggerUi, {
            routePrefix: '/api-docs',

            uiConfig: {
                docExpansion: 'full',
                deepLinking: false,
            },
        });

        // ============================================================
        // 3. SECURITY AND INFRASTRUCTURE
        // ============================================================

        const jwtSecret =
            process.env.JWT_SECRET?.trim();

        if (!jwtSecret) {
            throw new Error(
                'JWT_SECRET is missing. Configure JWT_SECRET in backend/.env before starting CodeForge.',
            );
        }

        await app.register(helmet, {
            global: true,

            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: [
                        "'self'",
                        process.env.FRONTEND_URL ||
                        'http://localhost:2003',
                    ],
                },
            },

            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },

            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin',
            },

            frameguard: {
                action: 'deny',
            },
        });

        app.addHook(
            'onRequest',
            async (_request, reply) => {
                reply.header(
                    'Permissions-Policy',
                    'geolocation=(), microphone=(), camera=(), payment=()',
                );
            },
        );

        app.addHook(
            'onResponse',
            metricsHook,
        );

        await app.register(
            fastifyCookie,
        );

        await app.register(
            fastifyJwt,
            {
                secret: jwtSecret,

                cookie: {
                    cookieName: 'token',
                    signed: false,
                },
            },
        );

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

        const frontendUrl =
            process.env.FRONTEND_URL ||
            'http://localhost:2003';

        const allowedOrigins = [
            frontendUrl,

            'http://localhost:2003',
            'http://127.0.0.1:2003',

            'http://localhost:4321',
            'http://127.0.0.1:4321',
        ].filter(
            (origin, index, origins) =>
                origins.indexOf(origin) ===
                index,
        );

        await app.register(cors, {
            origin: allowedOrigins,

            methods: [
                'GET',
                'POST',
                'PUT',
                'PATCH',
                'DELETE',
                'OPTIONS',
            ],

            credentials: true,
        });

        // ============================================================
        // 4. GLOBAL ERROR HANDLER
        // ============================================================

        app.setErrorHandler(
            (error: any, request, reply) => {
                const isProduction =
                    process.env.NODE_ENV ===
                    'production';

                if (
                    error.name ===
                    'MongoServerError' &&
                    error.code === 11000
                ) {
                    return reply
                        .status(409)
                        .send({
                            success: false,

                            error: {
                                code: 'CONFLICT',

                                message:
                                    'Duplicate key error. A resource with these unique values already exists.',

                                details:
                                    isProduction
                                        ? undefined
                                        : error.keyValue,
                            },
                        });
                }

                if (
                    error.name ===
                    'ValidationError' &&
                    error.errors
                ) {
                    return reply
                        .status(400)
                        .send({
                            success: false,

                            error: {
                                code: 'VALIDATION_ERROR',

                                message:
                                    'Database validation failed.',

                                details:
                                    Object.keys(
                                        error.errors,
                                    ).map(
                                        (key) =>
                                            error
                                                .errors[
                                                key
                                            ]
                                                .message,
                                    ),
                            },
                        });
                }

                if (
                    error.name ===
                    'CastError'
                ) {
                    return reply
                        .status(400)
                        .send({
                            success: false,

                            error: {
                                code: 'INVALID_ID',

                                message:
                                    'Invalid identifier format.',
                            },
                        });
                }

                if (
                    error.statusCode &&
                    error.code
                ) {
                    if (
                        error.statusCode >=
                        500
                    ) {
                        request.log.error(
                            error,
                        );
                    } else {
                        request.log.warn(
                            error,
                        );
                    }

                    return reply
                        .status(
                            error.statusCode,
                        )
                        .send({
                            success: false,

                            error: {
                                code: error.code,
                                message:
                                    error.message,
                            },
                        });
                }

                if (
                    error.validation
                ) {
                    return reply
                        .status(400)
                        .send({
                            success: false,

                            error: {
                                code: 'VALIDATION_ERROR',
                                message:
                                    error.message,
                                details:
                                    error.validation,
                            },
                        });
                }

                request.log.error(
                    error,
                );

                return reply
                    .status(500)
                    .send({
                        success: false,

                        error: {
                            code: 'INTERNAL_SERVER_ERROR',

                            message:
                                isProduction
                                    ? 'An unexpected error occurred.'
                                    : error.message,

                            ...(isProduction
                                ? {}
                                : {
                                    stack:
                                        error.stack,
                                }),
                        },
                    });
            },
        );

        // ============================================================
        // 5. API ROUTES
        // ============================================================

        await app.register(
            projectRoutes,
            {
                prefix:
                    '/api/projects',
            },
        );

        await app.register(
            experienceRoutes,
            {
                prefix:
                    '/api/experiences',
            },
        );

        await app.register(
            healthRoutes,
            {
                prefix: '/',
            },
        );

        // ============================================================
        // 6. HTTP SERVER
        // ============================================================

        const port = Number(
            process.env.PORT || 3002,
        );

        await app.listen({
            port,
            host: '0.0.0.0',
        });

        console.log(
            `🚀 CodeForge Backend is running on port ${port}`,
        );

        // ============================================================
        // 7. EXISTING AI DESCRIPTIONS
        // ============================================================

        /**
         * Run the missing-description scan AFTER the HTTP server is available.
         *
         * This means the backend can immediately serve requests while the AI
         * processes legacy projects in the background.
         *
         * Projects with an existing description are skipped automatically.
         */
        void generateMissingProjectDescriptions();
    } catch (error) {
        app.log.error(error);

        process.exit(1);
    }
}

/**
 * Graceful shutdown handler.
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

export default app;

if (
    process.env.NODE_ENV !== 'test'
) {
    void startServer();
}