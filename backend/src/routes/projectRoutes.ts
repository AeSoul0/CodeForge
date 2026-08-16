import { CreateProjectDTO, UpdateProjectDTO } from '../dtos/ProjectDTO';
import { authenticateAdmin } from '../middleware/auth';
/**
 * @file backend/src/routes/projectRoutes.ts
 * @description Fastify route definitions for the Projects resource.
 *
 * The GET endpoint is public because projects are part of the public
 * portfolio. Creation, updates, and deletion are protected using
 * the administrator API key.
 */

import { FastifyInstance } from 'fastify';

import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
} from '../controllers/projectController';

/**
 * Registers all API endpoints related to projects.
 *
 * Expected route prefix:
 * /api/projects
 */
export default async function projectRoutes(
    fastify: FastifyInstance,
) {
    // ---------------------------------------------------------------------------
    // [GET] /api/projects
    // Public endpoint used by the portfolio frontend.
    // ---------------------------------------------------------------------------

    fastify.get(
        '/',
        getProjects,
    );

    // ---------------------------------------------------------------------------
    // [POST] /api/projects
    // Protected endpoint used to create new projects.
    // ---------------------------------------------------------------------------

    /**
     * JSON schema used to validate project creation payloads.
     */
    const createProjectSchema = {
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['titolo', 'descrizione', 'tecnologie'],
            properties: {
                titolo: { type: 'string', minLength: 3, maxLength: 100 },
                descrizione: { type: 'string', minLength: 10, maxLength: 5000 },
                tecnologie: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 50 } },
                categoria: { type: 'string', maxLength: 50 },
                categorie: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 50 } },
                linkGithub: { type: 'string', maxLength: 500, pattern: '^https?:\\/\\/.+' },
                image: { type: 'string', maxLength: 500 }
            }
        }
    };

    fastify.post<{ Body: CreateProjectDTO }>(
        '/',
        {
            schema: createProjectSchema,

            /**
             * Protect project creation from unauthorized write operations.
             */
            preHandler: [authenticateAdmin],
        },
        createProject,
    );

    // ---------------------------------------------------------------------------
    // [PATCH] /api/projects/:id
    // Protected endpoint used to partially update an existing project.
    // ---------------------------------------------------------------------------

    /**
     * PATCH allows individual project fields to be changed without
     * replacing the entire database document.
     */
    const updateProjectSchema = {
        body: {
            type: 'object',
            additionalProperties: false,
            properties: {
                titolo: { type: 'string', minLength: 3, maxLength: 100 },
                descrizione: { type: 'string', minLength: 10, maxLength: 5000 },
                tecnologie: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 50 } },
                categoria: { type: 'string', maxLength: 50 },
                categorie: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 50 } },
                linkGithub: { anyOf: [{ type: 'string', maxLength: 500, pattern: '^https?:\\/\\/.+' }, { type: 'null' }] },
                image: { anyOf: [{ type: 'string', maxLength: 500 }, { type: 'null' }] }
            }
        }
    };

    fastify.patch<{ Params: { id: string }, Body: UpdateProjectDTO }>(
        '/:id',
        {
            schema: updateProjectSchema,

            /**
             * Protect project updates with the administrator API key.
             */
            preHandler: [authenticateAdmin],
        },
        updateProject,
    );

    // ---------------------------------------------------------------------------
    // [DELETE] /api/projects/:id
    // Protected endpoint used to permanently delete a project.
    // ---------------------------------------------------------------------------

    fastify.delete<{ Params: { id: string } }>(
        '/:id',
        {
            /**
             * Protect destructive operations with the administrator API key.
             */
            preHandler: [authenticateAdmin],
        },
        deleteProject,
    );
}