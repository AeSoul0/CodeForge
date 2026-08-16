import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
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
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import { seedAdmin } from './utils/seedAdmin';
import { metricsHook } from './middleware/metrics';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import mongoose from 'mongoose';

import connectDB from './config/db';

import 'dotenv/config';

const app = fastify({
    logger: true,
    connectionTimeout: 10000, // Drop connections hanging for > 10s
    keepAliveTimeout: 5000,
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
        await seedAdmin();

        // ======================================================
        // 2. API DOCUMENTATION (SWAGGER)
        // ======================================================

        await app.register(swagger, {
            swagger: {
                info: {
                    title: 'CodeForge API',
                    description: 'API documentation for CodeForge portfolio backend',
                    version: '1.0.0'
                },
                host: 'localhost:3002',
                schemes: ['http', 'https'],
                consumes: ['application/json'],
                produces: ['application/json']
            }
        });

        await app.register(swaggerUi, {
            routePrefix: '/api-docs',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false
            }
        });

        // ======================================================
        // 3. SECURITY / MIDDLEWARES
        // ======================================================

        /**
         * Adds common security-related HTTP headers.
         */
        await app.register(helmet, {
            global: true,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:4321']
                }
            },
            hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            frameguard: { action: 'deny' }
        });

        app.addHook('onRequest', async (request, reply) => {
            reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
        });

        app.addHook('onResponse', metricsHook);

        await app.register(fastifyCookie);
        await app.register(fastifyJwt, {
            secret: process.env.JWT_SECRET as string,
            cookie: { cookieName: 'token', signed: false }
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
        app.setErrorHandler((error: any, request, reply) => {
            const isProduction = process.env.NODE_ENV === 'production';
            
            // Mongoose DB Error Mapping
            if (error.name === 'MongoServerError' && error.code === 11000) {
                return reply.status(409).send({
                    success: false,
                    error: {
                        code: 'CONFLICT',
                        message: 'Duplicate key error. A resource with these unique values already exists.',
                        details: isProduction ? undefined : error.keyValue
                    }
                });
            }
            if (error.name === 'ValidationError' && error.errors) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Database validation failed.',
                        details: Object.keys(error.errors).map(key => error.errors[key].message)
                    }
                });
            }
            if (error.name === 'CastError') {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'Invalid identifier format.',
                    }
                });
            }

            if (error.statusCode && error.code) {
                if (error.statusCode >= 500) request.log.error(error);
                else request.log.warn(error);

                return reply.status(error.statusCode).send({
                    success: false,
                    error: { code: error.code, message: error.message }
                });
            }

            if (error.validation) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: error.message,
                        details: error.validation
                    }
                });
            }

            request.log.error(error);
            reply.status(500).send({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: isProduction ? 'An unexpected error occurred.' : error.message,
                    ...(isProduction ? {} : { stack: error.stack })
                }
            });
        });

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
         * Health endpoints (/live and /ready)
         * Used by the deployment platform and monitoring systems.
         */
        await app.register(healthRoutes, {
            prefix: '/',
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

const closeGracefully = async (signal: string) => {
    app.log.info(`Received signal to terminate: ${signal}`);
    try {
        await app.close();
        app.log.info('Fastify closed.');
        await mongoose.disconnect();
        app.log.info('MongoDB disconnected.');
        process.exit(0);
    } catch (err) {
        app.log.error('Error during graceful shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

export default app;
if (process.env.NODE_ENV !== 'test') {
    void startServer();
}