/**
 * @file backend/src/routes/healthRoutes.ts
 * @description Fastify route definitions and API schema validation.
 */

import { FastifyInstance } from 'fastify';
import { checkLiveness, checkReadiness } from '../controllers/healthController';
import { getMetrics } from '../middlewares/metrics';

export default async function healthRoutes(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
        return reply.status(200).send({
            name: 'CodeForge API',
            status: 'online',
            docs: '/api-docs'
        });
    });
    fastify.get('/live', checkLiveness);
    fastify.get('/ready', checkReadiness);
    fastify.get('/metrics', async (request, reply) => {
        return reply.status(200).send(getMetrics());
    });
}
