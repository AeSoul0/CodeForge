import { FastifyInstance } from 'fastify';
import { checkLiveness, checkReadiness } from '../controllers/healthController';
import { getMetrics } from '../middleware/metrics';

export default async function healthRoutes(fastify: FastifyInstance) {
    fastify.get('/live', checkLiveness);
    fastify.get('/ready', checkReadiness);
    fastify.get('/metrics', async (request, reply) => {
        return reply.status(200).send(getMetrics());
    });
}
