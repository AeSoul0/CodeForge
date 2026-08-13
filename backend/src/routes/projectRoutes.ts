/**
 * @file backend/src/routes/projectRoutes.ts
 * @description API Routes mapping for Projects. Includes JSON Schema validation and Authentication middlewares.
 */

import { FastifyInstance } from 'fastify';
import { getProjects, createProject } from '../controllers/projectController';

export default async function projectRoutes(fastify: FastifyInstance) {

    // ---------------------------------------------------------------------------
    // [GET] /api/projects : Public route to fetch all projects
    // ---------------------------------------------------------------------------
    fastify.get('/', getProjects);

    // ---------------------------------------------------------------------------
    // [POST] /api/projects : Protected route to create a new project
    // ---------------------------------------------------------------------------

    // ROADMAP Arch-1: Fastify JSON Schema Validation
    // Ensures payload structure is strict, preventing NoSQL injections and malformed data
    const createProjectSchema = {
        body: {
            type: 'object',
            required: ['titolo', 'descrizione', 'tecnologie'],
            properties: {
                titolo: { type: 'string', minLength: 3 },
                descrizione: { type: 'string', minLength: 10 },
                tecnologie: { type: 'array', items: { type: 'string' } },
                linkGithub: { type: 'string' }
            }
        }
    };

    fastify.post('/', {
        schema: createProjectSchema,

        // ROADMAP Sec-1: Auth Middleware via x-api-key
        // Protects the DB from unauthorized write operations
        preHandler: async (request, reply) => {
            const apiKey = request.headers['x-api-key'];
            const adminKey = process.env.ADMIN_API_KEY || 'super_secret_dev_key'; // Fallback for local testing

            if (!apiKey || apiKey !== adminKey) {
                return reply.status(401).send({
                    success: false,
                    error: 'Unauthorized. Invalid or missing x-api-key.'
                });
            }
        }
    }, createProject);
}