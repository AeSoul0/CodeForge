/**
 * @file backend/src/app.ts
 * @description Fastify application factory and HTTP/API configuration.
 *
 * This module is intentionally responsible only for creating and configuring
 * the Fastify application. Database connections, administrator seeding and
 * HTTP server startup are handled by index.ts.
 *
 * Keeping application configuration independent from server startup makes
 * the backend easier to test because integration tests can import the fully
 * configured Fastify instance without opening a network port.
 */

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify, {
    FastifyInstance,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import experienceRoutes from './routes/experienceRoutes';
import healthRoutes from './routes/healthRoutes';

import { metricsHook } from './middlewares/metrics';

type FastifyApplicationError = {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    statusCode?: unknown;
    validation?: unknown;
    errors?: unknown;
    keyValue?: unknown;
    stack?: unknown;
};

function normalizeError(
    error: unknown,
): FastifyApplicationError {
    if (
        typeof error === 'object' &&
        error !== null
    ) {
        return error as FastifyApplicationError;
    }

    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    return {
        message:
            typeof error === 'string'
                ? error
                : 'Unknown error',
    };
}

/**
 * Configure the Fastify application.
 *
 * This function registers infrastructure, security middleware,
 * authentication plugins, error handling and API routes.
 */
async function configureApp(
    app: FastifyInstance,
): Promise<FastifyInstance> {
    // ============================================================
    // 1. API DOCUMENTATION
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

            schemes: [
                'http',
                'https',
            ],

            consumes: [
                'application/json',
            ],

            produces: [
                'application/json',
            ],
        },
    });

    const isProduction =
        process.env.NODE_ENV ===
        'production';

    if (!isProduction) {
        await app.register(
            swaggerUi,
            {
                routePrefix:
                    '/api-docs',

                uiConfig: {
                    docExpansion:
                        'full',

                    deepLinking:
                        false,
                },
            },
        );
    }

    // ============================================================
    // 2. SECURITY AND INFRASTRUCTURE
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
                defaultSrc: [
                    "'self'",
                ],

                scriptSrc: [
                    "'self'",
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                ],

                imgSrc: [
                    "'self'",
                    'data:',
                    'https:',
                ],

                connectSrc: [
                    "'self'",
                    process.env.FRONTEND_URL ||
                        'http://localhost:2003',
                ],

                objectSrc: [
                    "'none'",
                ],

                baseUri: [
                    "'self'",
                ],

                formAction: [
                    "'self'",
                ],

                frameAncestors: [
                    "'none'",
                ],
            },
        },

        crossOriginResourcePolicy: {
            policy:
                'cross-origin',
        },

        hsts: {
            maxAge:
                31536000,

            includeSubDomains:
                true,

            preload:
                true,
        },

        referrerPolicy: {
            policy:
                'strict-origin-when-cross-origin',
        },

        frameguard: {
            action:
                'deny',
        },
    });

    app.addHook(
        'onRequest',
        async (
            _request,
            reply,
        ) => {
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
            secret:
                jwtSecret,

            sign: {
                algorithm:
                    'HS256',

                iss:
                    'codeforge',

                aud:
                    'admin',

                expiresIn:
                    '24h',
            },

            verify: {
                algorithms: [
                    'HS256',
                ],

                allowedIss:
                    'codeforge',

                allowedAud:
                    'admin',
            },

            cookie: {
                cookieName:
                    'token',

                signed:
                    false,
            },
        },
    );

    await app.register(
        rateLimit,
        {
            max:
                100,

            timeWindow:
                '1 minute',

            errorResponseBuilder:
                () => ({
                    statusCode:
                        429,

                    error:
                        'Too Many Requests',

                    message:
                        'Rate limit exceeded. Please try again later.',
                }),
        },
    );

    const allowedOrigins: string[] = [
        'http://localhost:2003',
        'http://127.0.0.1:2003',
        'http://localhost:4321',
        'http://127.0.0.1:4321',
        'https://www.aesoul0.com',
        'https://aesoul0.com',
    ];

    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(
            process.env.FRONTEND_URL.replace(
                /\/$/,
                '',
            ),
        );
    }

    await app.register(
        cors,
        {
            origin:
                allowedOrigins,

            methods: [
                'GET',
                'POST',
                'PUT',
                'PATCH',
                'DELETE',
                'OPTIONS',
            ],

            credentials:
                true,
        },
    );

    // ============================================================
    // 3. GLOBAL ERROR HANDLER
    // ============================================================

    app.setErrorHandler(
        (
            error: unknown,
            request,
            reply,
        ) => {
            const isProd =
                process.env.NODE_ENV ===
                'production';

            const err =
                normalizeError(error);

            const errorName =
                typeof err.name ===
                'string'
                    ? err.name
                    : undefined;

            const errorCode =
                typeof err.code ===
                'number' ||
                typeof err.code ===
                'string'
                    ? err.code
                    : undefined;

            const errorStatus =
                typeof err.statusCode ===
                'number'
                    ? err.statusCode
                    : undefined;

            const errorMessage =
                typeof err.message ===
                'string'
                    ? err.message
                    : 'An unexpected error occurred.';

            if (
                errorName ===
                    'MongoServerError' &&
                errorCode ===
                    11000
            ) {
                return reply
                    .status(409)
                    .send({
                        success:
                            false,

                        error: {
                            code:
                                'CONFLICT',

                            message:
                                'Duplicate key error.',

                            details:
                                isProd
                                    ? undefined
                                    : err.keyValue,
                        },
                    });
            }

            if (
                errorName ===
                    'ValidationError' &&
                err.errors
            ) {
                return reply
                    .status(400)
                    .send({
                        success:
                            false,

                        error: {
                            code:
                                'VALIDATION_ERROR',

                            message:
                                'Database validation failed.',
                        },
                    });
            }

            if (
                errorName ===
                'CastError'
            ) {
                return reply
                    .status(400)
                    .send({
                        success:
                            false,

                        error: {
                            code:
                                'INVALID_ID',

                            message:
                                'Invalid identifier format.',
                        },
                    });
            }

            if (
                err.validation
            ) {
                return reply
                    .status(400)
                    .send({
                        success:
                            false,

                        error: {
                            code:
                                'VALIDATION_ERROR',

                            message:
                                errorMessage,

                            details:
                                err.validation,
                        },
                    });
            }

            if (
                errorStatus !==
                    undefined &&
                errorStatus >= 400 &&
                errorStatus < 500
            ) {
                return reply
                    .status(errorStatus)
                    .send({
                        success:
                            false,

                        error: {
                            code:
                                typeof err.code ===
                                'string'
                                    ? err.code
                                    : 'BAD_REQUEST',

                            message:
                                errorMessage,
                        },
                    });
            }

            request.log.error(
                error,
            );

            return reply
                .status(500)
                .send({
                    success:
                        false,

                    error: {
                        code:
                            'INTERNAL_SERVER_ERROR',

                        message:
                            isProd
                                ? 'An unexpected error occurred.'
                                : errorMessage,

                        stack:
                            isProd
                                ? undefined
                                : err.stack,
                    },
                });
        },
    );

    // ============================================================
    // 4. API ROUTES
    // ============================================================

    await app.register(
        authRoutes,
        {
            prefix:
                '/api/auth',
        },
    );

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
            prefix:
                '/',
        },
    );

    return app;
}

/**
 * Create the Fastify application instance.
 */
const app = fastify({
    logger: {
        redact: [
            'req.headers.authorization',
            'req.headers.cookie',
        ],

        serializers: {
            req: (
                request,
            ) => ({
                id:
                    request.id,

                method:
                    request.method,

                url:
                    request.url,
            }),

            res: (
                reply,
            ) => ({
                statusCode:
                    reply.statusCode,
            }),
        },
    },

    connectionTimeout:
        10000,

    keepAliveTimeout:
        5000,
});

/**
 * Configure the application immediately when this module is imported.
 *
 * Fastify's lifecycle management ensures app.ready() waits until all
 * asynchronous plugin and route registration has completed.
 */
export const appInitialization =
    configureApp(app);

export default app;