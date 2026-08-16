import { FastifyInstance } from 'fastify';
import { adminService } from '../services/AdminService';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
        const { username, password } = request.body as any;
        
        if (!username || !password) {
            return reply.status(400).send({ success: false, message: 'Username and password are required' });
        }

        const admin = await adminService.validateCredentials(username, password);
        const token = fastify.jwt.sign({ id: admin._id, username: admin.username });

        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return reply.send({ success: true, message: 'Logged in successfully' });
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
