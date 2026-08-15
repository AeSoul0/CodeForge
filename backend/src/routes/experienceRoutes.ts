/**
 * @file backend/src/routes/experienceRoutes.ts
 * @description Fastify route definitions for the Experiences resource.
 *
 * The GET endpoint is public because experience information is part
 * of the public portfolio.
 *
 * Write operations are protected using the same API-key mechanism
 * already adopted by the Projects resource.
 */

import { FastifyInstance } from 'fastify';

import {
    getExperiences,
    createExperience,
    updateExperienceImage,
    deleteExperience,
} from '../controllers/experienceController';

/**
 * Registers all API endpoints related to experiences.
 *
 * Expected route prefix:
 * /api/experiences
 */
export default async function experienceRoutes(
    fastify: FastifyInstance,
) {
    // ---------------------------------------------------------------------------
    // [GET] /api/experiences
    // Public endpoint used by the portfolio frontend.
    // ---------------------------------------------------------------------------

    fastify.get(
        '/',
        getExperiences,
    );

    // ---------------------------------------------------------------------------
    // [POST] /api/experiences
    // Protected endpoint used to create experience records.
    // ---------------------------------------------------------------------------

    /**
     * JSON schema used to validate incoming experience payloads.
     */
    const createExperienceSchema = {
        body: {
            type: 'object',

            required: [
                'role',
                'company',
                'description',
                'startDate',
            ],

            properties: {
                /**
                 * Experience role or position title.
                 */
                role: {
                    type: 'string',
                    minLength: 2,
                },

                /**
                 * Organization or institution name.
                 */
                company: {
                    type: 'string',
                    minLength: 2,
                },

                /**
                 * Experience description.
                 */
                description: {
                    type: 'string',
                    minLength: 10,
                },

                /**
                 * Technologies associated with the experience.
                 */
                technologies: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },

                /**
                 * ISO-compatible start date.
                 */
                startDate: {
                    type: 'string',
                },

                /**
                 * Optional ISO-compatible end date.
                 */
                endDate: {
                    anyOf: [
                        {
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },

                /**
                 * Indicates whether the experience is ongoing.
                 */
                current: {
                    type: 'boolean',
                },

                /**
                 * Optional image or logo URL/path.
                 */
                image: {
                    anyOf: [
                        {
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
        },
    };

    fastify.post(
        '/',
        {
            schema: createExperienceSchema,

            /**
             * Protect experience creation with the project's
             * existing x-api-key authentication mechanism.
             */
            preHandler: async (
                request,
                reply,
            ) => {
                const apiKey =
                    request.headers['x-api-key'];

                const adminKey =
                    process.env.ADMIN_API_KEY ||
                    'super_secret_dev_key';

                if (
                    !apiKey ||
                    apiKey !== adminKey
                ) {
                    return reply
                        .status(401)
                        .send({
                            success: false,
                            error:
                                'Unauthorized. Invalid or missing x-api-key.',
                        });
                }
            },
        },
        createExperience,
    );

    // ---------------------------------------------------------------------------
    // [PATCH] /api/experiences/:id/image
    // Protected endpoint used to update only the image of an experience.
    // ---------------------------------------------------------------------------

    /**
     * Allows the administrator to change or remove an experience image
     * without modifying any other field in the database.
     */
    const updateExperienceImageSchema = {
        body: {
            type: 'object',

            required: [
                'image',
            ],

            properties: {
                /**
                 * Image URL or public frontend path.
                 *
                 * Null removes the image from the experience.
                 */
                image: {
                    anyOf: [
                        {
                            type: 'string',
                        },
                        {
                            type: 'null',
                        },
                    ],
                },
            },
        },
    };

    fastify.patch(
        '/:id/image',
        {
            schema: updateExperienceImageSchema,

            /**
             * Protect image updates with the same API key
             * authentication mechanism used by creation.
             */
            preHandler: async (
                request,
                reply,
            ) => {
                const apiKey =
                    request.headers['x-api-key'];

                const adminKey =
                    process.env.ADMIN_API_KEY ||
                    'super_secret_dev_key';

                if (
                    !apiKey ||
                    apiKey !== adminKey
                ) {
                    return reply
                        .status(401)
                        .send({
                            success: false,
                            error:
                                'Unauthorized. Invalid or missing x-api-key.',
                        });
                }
            },
        },
        updateExperienceImage,
    );

    // ---------------------------------------------------------------------------
    // [DELETE] /api/experiences/:id
    // Protected endpoint used to permanently remove an experience.
    // ---------------------------------------------------------------------------

    /**
     * Deletes a complete experience record from MongoDB.
     */
    fastify.delete(
        '/:id',
        {
            /**
             * Protect deletion with the project's existing
             * administrator API-key authentication.
             */
            preHandler: async (
                request,
                reply,
            ) => {
                const apiKey =
                    request.headers['x-api-key'];

                const adminKey =
                    process.env.ADMIN_API_KEY ||
                    'super_secret_dev_key';

                if (
                    !apiKey ||
                    apiKey !== adminKey
                ) {
                    return reply
                        .status(401)
                        .send({
                            success: false,
                            error:
                                'Unauthorized. Invalid or missing x-api-key.',
                        });
                }
            },
        },
        deleteExperience,
    );
}