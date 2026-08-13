/**
 * @file backend/src/routes/health.ts
 * @description Health check endpoint returning system metrics, uptime, and database latency.
 */

import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

export default async function healthRoutes(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
        const start = performance.now();
        let dbStatus = 'disconnected';

        try {
            // Ping the database to calculate real latency
            if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
                await mongoose.connection.db.admin().ping();
                dbStatus = 'connected';
            }
        } catch (error) {
            dbStatus = 'error';
            fastify.log.error({ error }, 'Database ping failed during health check');
        }

        const dbLatency = Math.round(performance.now() - start);

        return reply.send({
            server: 'online',
            environment: process.env.NODE_ENV || 'development',
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                latencyMs: dbLatency
            }
        });
    });
}