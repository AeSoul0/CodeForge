import { CreateExperienceDTO, UpdateExperienceDTO } from '../dtos/ExperienceDTO';
import { authenticateAdmin } from '../middleware/auth';
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

import { FastifyInstance } from "fastify";

import {
    getExperiences,
    createExperience,
    updateExperience,
    updateExperienceImage,
    deleteExperience,
} from "../controllers/experienceController";

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
        "/",
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
            additionalProperties: false,
            required: ['role', 'company', 'description', 'startDate'],
            properties: {
                role: { type: 'string', minLength: 2, maxLength: 100 },
                company: { type: 'string', minLength: 2, maxLength: 100 },
                description: { type: 'string', minLength: 10, maxLength: 5000 },
                technologies: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 50 } },
                startDate: { type: 'string', maxLength: 50 },
                endDate: { anyOf: [{ type: 'string', maxLength: 50 }, { type: 'null' }] },
                current: { type: 'boolean' },
                image: { anyOf: [{ type: 'string', maxLength: 500 }, { type: 'null' }] }
            }
        }
    };

    fastify.post<{ Body: CreateExperienceDTO }>(
        "/",
        {
            schema: createExperienceSchema,

            /**
             * Protect experience creation with the project's
             * existing x-api-key authentication mechanism.
             */
            preHandler: [authenticateAdmin],
        },
        createExperience,
    );

    // ---------------------------------------------------------------------------
    // [PATCH] /api/experiences/:id
    // Protected endpoint used to update an entire experience record.
    // ---------------------------------------------------------------------------

    /**
     * JSON schema used to validate partial experience updates.
     *
     * No fields are required because PATCH requests only need to contain
     * the fields that should actually be changed.
     */
    const updateExperienceSchema = {
        body: {
            type: 'object',
            additionalProperties: false,
            properties: {
                role: { type: 'string', minLength: 2, maxLength: 100 },
                company: { type: 'string', minLength: 2, maxLength: 100 },
                description: { type: 'string', minLength: 10, maxLength: 5000 },
                technologies: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 50 } },
                startDate: { type: 'string', maxLength: 50 },
                endDate: { anyOf: [{ type: 'string', maxLength: 50 }, { type: 'null' }] },
                current: { type: 'boolean' },
                image: { anyOf: [{ type: 'string', maxLength: 500 }, { type: 'null' }] }
            }
        }
    };

    fastify.patch<{ Params: { id: string }, Body: UpdateExperienceDTO }>(
        "/:id",
        {
            schema: updateExperienceSchema,

            /**
             * Protect full experience updates with the same
             * administrator API-key authentication mechanism.
             */
            preHandler: [authenticateAdmin],
        },
        updateExperience,
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
            type: "object",

            required: [
                "image",
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
                            type: "string",
                        },
                        {
                            type: "null",
                        },
                    ],
                },
            },
        },
    };

    fastify.patch<{ Params: { id: string }, Body: { image: string | null } }>(
        "/:id/image",
        {
            schema: updateExperienceImageSchema,

            /**
             * Protect image updates with the same API key
             * authentication mechanism used by creation.
             */
            preHandler: [authenticateAdmin],
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
    fastify.delete<{ Params: { id: string } }>(
        "/:id",
        {
            /**
             * Protect deletion with the project's existing
             * administrator API-key authentication.
             */
            preHandler: [authenticateAdmin],
        },
        deleteExperience,
    );
}