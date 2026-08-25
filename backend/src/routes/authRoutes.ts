/**
 * @file backend/src/routes/authRoutes.ts
 * @description Authentication endpoints for administrator sessions.
 *
 * Responsibilities:
 * - Authenticate administrator credentials.
 * - Issue an HttpOnly JWT session cookie.
 * - Return the authenticated administrator identity.
 * - Clear the session cookie during logout.
 *
 * Cookie security:
 * - test/development HTTP: Secure=false;
 * - production HTTPS: Secure=true.
 */

import {
    FastifyInstance,
} from 'fastify';

import {
    adminService,
} from '../services/AdminService';

export default async function authRoutes(
    fastify: FastifyInstance,
): Promise<void> {
    fastify.post<{
        Body: {
            username?: string;
            password?: string;
        };
    }>(
        '/login',
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow:
                        '1 minute',
                },
            },
        },
        async (
            request,
            reply,
        ) => {
            const {
                username,
                password,
            } = request.body;

            if (
                !username ||
                !password
            ) {
                return reply
                    .status(400)
                    .send({
                        success: false,
                        message:
                            'Username and password are required',
                    });
            }

            const admin =
                await adminService.validateCredentials(
                    username,
                    password,
                );

            const token =
                fastify.jwt.sign({
                    id:
                        admin._id,
                    username:
                        admin.username,
                    role:
                        'admin',
                });

            const isProduction =
                process.env.NODE_ENV ===
                'production';

            reply.setCookie(
                'token',
                token,
                {
                    path: '/',
                    httpOnly: true,

                    secure:
                        isProduction,

                    sameSite:
                        isProduction
                            ? 'none'
                            : 'lax',

                    maxAge:
                        60 * 60 * 24,
                },
            );

            return reply
                .status(200)
                .send({
                    success: true,
                    message:
                        'Authentication successful',
                });
        },
    );

    /**
     * Return the current administrator session.
     *
     * This endpoint is intentionally protected by the JWT itself and is used
     * by the Astro dashboard guard to determine whether the browser session
     * is still valid.
     */
    fastify.get(
        '/me',
        async (
            request,
            reply,
        ) => {
            try {
                const decoded =
                    await request.jwtVerify() as {
                        id?: string;
                        username?: string;
                        role?: string;
                    };

                if (
                    decoded.role !==
                    'admin'
                ) {
                    return reply
                        .status(403)
                        .send({
                            success:
                                false,
                            message:
                                'Admin access required',
                        });
                }

                return reply
                    .status(200)
                    .send({
                        success:
                            true,
                        user: {
                            id:
                                decoded.id,
                            username:
                                decoded.username,
                            role:
                                decoded.role,
                        },
                    });
            } catch {
                return reply
                    .status(401)
                    .send({
                        success:
                            false,
                        message:
                            'Authentication required',
                    });
            }
        },
    );

    fastify.post(
        '/logout',
        async (
            _request,
            reply,
        ) => {
            const isProduction =
                process.env.NODE_ENV ===
                'production';

            reply.clearCookie(
                'token',
                {
                    path: '/',
                    httpOnly: true,

                    secure:
                        isProduction,

                    sameSite:
                        isProduction
                            ? 'none'
                            : 'lax',
                },
            );

            return reply
                .status(200)
                .send({
                    success:
                        true,
                    message:
                        'Logged out successfully',
                });
        },
    );
}