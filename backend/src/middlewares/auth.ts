/**
 * @file backend/src/middleware/auth.ts
 * @description Authentication middleware for protected administrative routes.
 *
 * In development, the middleware can optionally bypass JWT verification when
 * explicitly enabled through DEV_BYPASS_AUTH=true.
 *
 * This must never be enabled in production.
 */

import {
    FastifyReply,
    FastifyRequest,
} from 'fastify';

/**
 * Verify the administrator JWT.
 *
 * Development bypass:
 * - NODE_ENV must be "development"
 * - DEV_BYPASS_AUTH must be "true"
 *
 * Production always requires a valid JWT.
 */
export async function authenticateAdmin(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const isDevelopment =
        process.env.NODE_ENV === 'development';

    const bypassAuth =
        process.env.DEV_BYPASS_AUTH === 'true';

    /**
     * Development-only bypass.
     *
     * This is intentionally impossible in production because both conditions
     * must be satisfied.
     */
    if (isDevelopment && bypassAuth) {
        request.log.warn(
            '[AUTH] DEV_BYPASS_AUTH is enabled. JWT verification is skipped.',
        );

        return;
    }

    try {
        const decoded = await request.jwtVerify() as { role?: string };
        if (decoded.role !== 'admin') {
            request.log.warn('[AUTH] Token valid but missing admin role.');
            return reply.status(403).send({
                success: false,
                error: 'Forbidden: Admin access required',
            });
        }
    } catch (error) {
        request.log.warn(
            '[AUTH] JWT verification failed.',
        );

        return reply.status(401).send({
            success: false,
            error: 'Unauthorized: Invalid or missing token',
        });
    }
}