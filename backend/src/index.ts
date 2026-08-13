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

const app = fastify({ logger: true });

async function startServer() {
    try {
        // --- 1. CONNETTI AL DATABASE MONGODB ---
        await connectDB();

        // --- 2. MIDDLEWARES ---
        await app.register(helmet, { global: true });
        await app.register(rateLimit, {
            max: 100,
            timeWindow: '1 minute',
            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.'
            })
        });
        await app.register(cors, {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:4321',
                'http://127.0.0.1:4321'
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        });

        // --- 3. GESTIONE ERRORI GLOBALE ---
        app.setErrorHandler((error: any, request, reply) => {
            request.log.error(error);
            const statusCode = error.statusCode || 500;
            const isProduction = process.env.NODE_ENV === 'production';

            reply.status(statusCode).send({
                success: false,
                statusCode,
                error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
                message: (statusCode === 500 && isProduction)
                    ? 'An unexpected error occurred on the server.'
                    : error.message,
                ...(isProduction ? {} : { stack: error.stack })
            });
        });

        // --- 4. REGISTRAZIONE ROTTE ---
        await app.register(projectRoutes, { prefix: '/api/projects' });

        app.get('/api/health', async () => {
            return { status: 'ok', uptime: process.uptime() };
        });

        // --- 5. START SERVER ---
        const port = parseInt(process.env.PORT || '3002', 10);
        await app.listen({ port, host: '127.0.0.1' });
        console.log(`🚀 CodeForge Backend locked and loaded on port ${port}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();