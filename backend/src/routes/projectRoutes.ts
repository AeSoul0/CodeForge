/**
 * backend/src/routes/projectRoutes.ts
 * * Architecture Layer: Routing & Transport
 * Responsibility: Maps URL endpoints to Controllers, enforces JSON schema validation, 
 * and applies security middlewares.
 */

import { FastifyInstance } from 'fastify';
import * as projectController from '../controllers/projectController';

export default async function projectRoutes(fastify: FastifyInstance) {

    // ==========================================
    // 🟢 PUBLIC ROUTES
    // ==========================================

    fastify.get('/api/projects', projectController.getProjectsHandler);

    // ==========================================
    // 🔴 PROTECTED ROUTES
    // ==========================================

    fastify.post('/api/projects', {
        schema: {
            body: {
                type: 'object',
                required: ['titolo', 'descrizione', 'tecnologie'],
                properties: {
                    titolo: { type: 'string', minLength: 3 },
                    descrizione: { type: 'string', minLength: 10 },
                    image: { type: 'string', format: 'uri' },
                    tecnologie: { type: 'array', items: { type: 'string' } },
                    linkGithub: { type: 'string', format: 'uri' }
                }
            }
        },
        preHandler: async (request, reply) => {
            const apiKey = request.headers['x-api-key'] as string;

            if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
                return reply.status(401).send({
                    error: 'Unauthorized. The required administrative API key is missing or invalid.'
                });
            }
        }
    }, projectController.createProjectHandler);
}