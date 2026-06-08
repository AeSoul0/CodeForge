/**
 * backend/src/index.ts
 * * Architecture Layer: Application Bootstrap
 * Responsibility: Initializes the Fastify server instance, registers global plugins (CORS),
 * establishes the database connection, and mounts the API routing modules.
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import connectDB from './config/db';
import projectRoutes from './routes/projectRoutes';
import healthRoutes from './routes/health';

import * as dotenv from 'dotenv';
dotenv.config(); // 🧠 Load the .env file directly into Node

// Instantiate the Fastify server with internal logging enabled
const fastify: FastifyInstance = Fastify({ logger: true });

/**
 * Server Initialization & Boot Sequence
 */
const startServer = async () => {
    try {
        // 1. Establish connection to the MongoDB cluster
        await connectDB();

        // 2. Register Global Middlewares
        // Restrict incoming requests to trusted origins to prevent CSRF and unauthorized usage
        await fastify.register(cors, {
            origin: [process.env.FRONTEND_URL || 'http://localhost:2003', 'https://iltuoportfolio.vercel.app'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'x-api-key'],
        });

        // 3. Mount Route Controllers
        await fastify.register(healthRoutes);
        await fastify.register(projectRoutes);

        // 4. Bind Server to Port
        const PORT = parseInt(process.env.PORT || '3002', 10);

        // Listen on '0.0.0.0' to ensure compatibility with cloud deployment platforms (like Render/Vercel)
        await fastify.listen({ port: PORT, host: '0.0.0.0' });

        fastify.log.info(`🚀 CodeForge Backend successfully booted on port ${PORT}`);
    } catch (error) {
        fastify.log.error({ err: error }, '❌ Fatal Error during server bootstrap');
        process.exit(1);
    }
};

// Execute the boot sequence
startServer();