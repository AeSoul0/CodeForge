/**
 * @file backend/src/routes/projectRoutes.ts
 * @description Fastify route definitions for the Project resource.
 *
 * Public:
 * - GET /api/projects
 *
 * Protected:
 * - POST /api/projects
 * - PATCH /api/projects/:id
 * - DELETE /api/projects/:id
 * - POST /api/projects/:id/generate-ai
 */

import { FastifyInstance } from 'fastify';

import {
    CreateProjectDTO,
    UpdateProjectDTO,
} from '../dtos/ProjectDTO';

import { authenticateAdmin } from '../middlewares/auth';

import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    generateAIForProject,
} from '../controllers/projectController';

/**
 * Register project-related API routes.
 */
export default async function projectRoutes(
    fastify: FastifyInstance,
) {
    // ============================================================
    // GET /api/projects
    // ============================================================

    /**
     * Public endpoint used by the portfolio frontend.
     */
    fastify.get(
        '/',
        getProjects,
    );

    // ============================================================
    // POST /api/projects/:name/generate-ai
    // ============================================================

    /**
     * Forcefully regenerate the AI-generated project documentation.
     *
     * This endpoint remains available for explicit manual regeneration.
     */
    fastify.post<{
        Params: {
            name: string;
        };
    }>(
        '/:name/generate-ai',
        {
            preHandler: [
                authenticateAdmin,
            ],
        },
        generateAIForProject,
    );

    // ============================================================
    // POST /api/projects
    // ============================================================

    /**
     * JSON schema used to validate project creation payloads.
     */
    const createProjectSchema = {
        body: {
            type: 'object',

            additionalProperties: false,

            required: [
                'titolo',
                'descrizione',
                'tecnologie',
            ],

            properties: {
                titolo: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 100,
                },

                role: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 100,
                },

                descrizione: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 5000,
                },

                descrizioneLunga: {
                    type: 'string',
                    maxLength: 50000,
                },

                tecnologie: {
                    type: 'array',
                    maxItems: 30,
                    items: {
                        type: 'string',
                        maxLength: 50,
                    },
                },

                categoria: {
                    type: 'string',
                    maxLength: 50,
                },

                categorie: {
                    type: 'array',
                    maxItems: 10,
                    items: {
                        type: 'string',
                        maxLength: 50,
                    },
                },

                linkGithub: {
                    type: 'string',
                    maxLength: 500,
                    pattern: '^https?:\\\\/\\\\/.+',
                },

                image: {
                    type: 'string',
                    maxLength: 500,
                },

                experienceId: {
                    type: 'string',
                    pattern: '^[0-9a-fA-F]{24}$',
                },
            },
        },
    };

    fastify.post<{
        Body: CreateProjectDTO;
    }>(
        '/',
        {
            schema: createProjectSchema,

            preHandler: [
                authenticateAdmin,
            ],
        },
        createProject,
    );

    // ============================================================
    // PATCH /api/projects/:name
    // ============================================================

    /**
     * JSON schema used to validate project update payloads.
     */
    const updateProjectSchema = {
        body: {
            type: 'object',

            additionalProperties: false,

            properties: {
                titolo: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 100,
                },

                role: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 100,
                },

                descrizione: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 5000,
                },

                descrizioneLunga: {
                    type: 'string',
                    maxLength: 50000,
                },

                tecnologie: {
                    type: 'array',
                    maxItems: 30,
                    items: {
                        type: 'string',
                        maxLength: 50,
                    },
                },

                categoria: {
                    type: 'string',
                    maxLength: 50,
                },

                categorie: {
                    type: 'array',
                    maxItems: 10,
                    items: {
                        type: 'string',
                        maxLength: 50,
                    },
                },

                linkGithub: {
                    anyOf: [
                        {
                            type: 'string',
                            maxLength: 500,
                            pattern: '^https?:\\\\/\\\\/.+',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                image: {
                    anyOf: [
                        {
                            type: 'string',
                            maxLength: 500,
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                experienceId: {
                    anyOf: [
                        {
                            type: 'string',
                            pattern: '^[0-9a-fA-F]{24}$',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                /**
                 * This flag controls the AI regeneration workflow.
                 *
                 * It is consumed by the controller and is not persisted
                 * as part of the Project document.
                 */
                regenerateAI: {
                    type: 'boolean',
                    default: false,
                },
            },
        },
    };

    fastify.patch<{
        Params: {
            name: string;
        };

        Body: UpdateProjectDTO;
    }>(
        '/:name',
        {
            schema: updateProjectSchema,

            preHandler: [
                authenticateAdmin,
            ],
        },
        updateProject,
    );

    // ============================================================
    // DELETE /api/projects/:name
    // ============================================================

    /**
     * Permanently delete a project.
     */
    fastify.delete<{
        Params: {
            name: string;
        };
    }>(
        '/:name',
        {
            preHandler: [
                authenticateAdmin,
            ],
        },
        deleteProject,
    );
}