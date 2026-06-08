/**
 * backend/src/routes/health.ts
 * * Architecture Layer: DevOps & Monitoring
 * Responsibility: Provides a basic liveness probe for container orchestrators and PaaS health checks.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
    fastify.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
        return reply.status(200).send({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
}