/**
 * @file backend/src/routes/authRoutes.ts
 * @description Fastify route definitions and API schema validation.
 */

import { FastifyInstance } from 'fastify';
import { adminService } from '../services/AdminService';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: { username?: string; password?: string } }>('/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
        const { username, password } = request.body;
        
        if (!username || !password) {
            return reply.status(400).send({ success: false, message: 'Username and password are required' });
        }

        const admin = await adminService.validateCredentials(username, password);
        const token = fastify.jwt.sign({ id: admin._id, username: admin.username, role: 'admin' });

        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return reply.status(200).send({
            success: true,
            message: 'Authentication successful',
        });
    });

    fastify.post('/logout', async (request, reply) => {
        reply.clearCookie('token', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return reply.send({ success: true, message: 'Logged out successfully' });
    });
}
