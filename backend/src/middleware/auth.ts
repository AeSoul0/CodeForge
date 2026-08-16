import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT token present in the HttpOnly cookie.
 */
export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ success: false, error: 'Unauthorized: Invalid or missing token' });
    }
}
