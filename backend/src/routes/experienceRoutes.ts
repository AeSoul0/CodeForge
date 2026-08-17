/**
 * @file backend/src/routes/experienceRoutes.ts
 * @description Fastify route definitions for the Experiences resource.
 */

import { FastifyInstance } from "fastify";
import mongoose from "mongoose";

import {
    getExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
} from "../controllers/experienceController";

import Experience from "../models/Experiences";
import { authenticateAdmin } from "../middlewares/auth";
import {
    CreateExperienceDTO,
    UpdateExperienceDTO,
} from "../dtos/ExperienceDTO";

/**
 * Maximum accepted image payload.
 *
 * The Base64 representation is larger than the original binary file,
 * therefore the limit is deliberately higher than the decoded image size.
 */
const MAX_IMAGE_BASE64_LENGTH = 10 * 1024 * 1024;

/**
 * Extract the MIME type and Base64 payload from a data URI.
 *
 * Example:
 * data:image/jpeg;base64,/9j/4AAQ...
 */
function parseDataUri(dataUri: string): {
    mimeType: string;
    base64Data: string;
} {
    const match = dataUri.match(
        /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
    );

    if (!match) {
        throw new Error(
            "Invalid image format. Expected a Base64 data URI such as data:image/jpeg;base64,...",
        );
    }

    return {
        mimeType: match[1].toLowerCase(),
        base64Data: match[2],
    };
}

/**
 * Basic MIME whitelist.
 */
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

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
    // ---------------------------------------------------------------------------

    fastify.get(
        "/",
        getExperiences,
    );

    // ---------------------------------------------------------------------------
    // [POST] /api/experiences
    // ---------------------------------------------------------------------------

    const createExperienceSchema = {
        body: {
            type: "object",
            additionalProperties: false,
            required: [
                "role",
                "company",
                "description",
                "startDate",
            ],
            properties: {
                role: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                },

                company: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                },

                description: {
                    type: "string",
                    minLength: 10,
                    maxLength: 5000,
                },

                technologies: {
                    type: "array",
                    maxItems: 30,
                    items: {
                        type: "string",
                        maxLength: 50,
                    },
                },

                startDate: {
                    type: "string",
                    maxLength: 50,
                },

                endDate: {
                    anyOf: [
                        {
                            type: "string",
                            maxLength: 50,
                        },
                        {
                            type: "null",
                        },
                    ],
                },

                current: {
                    type: "boolean",
                },

                image: {
                    anyOf: [
                        {
                            type: "string",
                            maxLength: 500,
                        },
                        {
                            type: "null",
                        },
                    ],
                },
            },
        },
    };

    fastify.post<{
        Body: CreateExperienceDTO;
    }>(
        "/",
        {
            schema: createExperienceSchema,
            preHandler: [authenticateAdmin],
        },
        createExperience,
    );

    // ---------------------------------------------------------------------------
    // [PATCH] /api/experiences/:id
    // ---------------------------------------------------------------------------

    const updateExperienceSchema = {
        body: {
            type: "object",
            additionalProperties: false,
            properties: {
                role: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                },

                company: {
                    type: "string",
                    minLength: 2,
                    maxLength: 100,
                },

                description: {
                    type: "string",
                    minLength: 10,
                    maxLength: 5000,
                },

                technologies: {
                    type: "array",
                    maxItems: 30,
                    items: {
                        type: "string",
                        maxLength: 50,
                    },
                },

                startDate: {
                    type: "string",
                    maxLength: 50,
                },

                endDate: {
                    anyOf: [
                        {
                            type: "string",
                            maxLength: 50,
                        },
                        {
                            type: "null",
                        },
                    ],
                },

                current: {
                    type: "boolean",
                },

                image: {
                    anyOf: [
                        {
                            type: "string",
                            maxLength: 500,
                        },
                        {
                            type: "null",
                        },
                    ],
                },
            },
        },
    };

    fastify.patch<{
        Params: { id: string };
        Body: UpdateExperienceDTO;
    }>(
        "/:id",
        {
            schema: updateExperienceSchema,
            preHandler: [authenticateAdmin],
        },
        updateExperience,
    );

    // ---------------------------------------------------------------------------
    // [PATCH] /api/experiences/:id/image
    //
    // Stores the actual image bytes in MongoDB.
    // ---------------------------------------------------------------------------

    fastify.patch<{
        Params: { id: string };
        Body: { image: string | null };
    }>(
        "/:id/image",
        {
            bodyLimit: 12 * 1024 * 1024,
            schema: {
                body: {
                    type: "object",
                    required: ["image"],
                    additionalProperties: false,
                    properties: {
                        image: {
                            anyOf: [
                                {
                                    type: "string",
                                    maxLength: MAX_IMAGE_BASE64_LENGTH,
                                },
                                {
                                    type: "null",
                                },
                            ],
                        },
                    },
                },
            },
            preHandler: [authenticateAdmin],
        },
        async (request, reply) => {
            const { id } = request.params;
            const { image } = request.body;

            if (!mongoose.isValidObjectId(id)) {
                return reply.code(400).send({
                    success: false,
                    message: "Invalid experience id.",
                });
            }

            const experience = await Experience.findById(id);

            if (!experience) {
                return reply.code(404).send({
                    success: false,
                    message: "Experience not found.",
                });
            }

            /**
             * Null removes the stored image.
             */
            if (image === null) {
                experience.image = null;
                experience.imageData = null;
                experience.imageMimeType = null;
                experience.imageFileName = null;

                await experience.save();

                return reply.send({
                    success: true,
                    data: {
                        id: experience._id.toString(),
                        image: null,
                    },
                });
            }

            try {
                const { mimeType, base64Data } = parseDataUri(image);

                if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
                    return reply.code(400).send({
                        success: false,
                        message:
                            "Unsupported image type. Allowed types: JPEG, PNG, WEBP.",
                    });
                }

                const imageBuffer = Buffer.from(base64Data, "base64");

                if (!imageBuffer.length) {
                    return reply.code(400).send({
                        success: false,
                        message: "Image payload is empty.",
                    });
                }

                /**
                 * Keep a conservative binary limit below MongoDB's
                 * 16 MB BSON document limit.
                 */
                const maxBinarySize = 8 * 1024 * 1024;

                if (imageBuffer.length > maxBinarySize) {
                    return reply.code(413).send({
                        success: false,
                        message:
                            "Image is too large. Maximum decoded image size is 8 MB.",
                    });
                }

                experience.imageData = imageBuffer;
                experience.imageMimeType = mimeType;
                experience.imageFileName =
                    mimeType === "image/jpeg"
                        ? "experience.jpg"
                        : mimeType === "image/png"
                            ? "experience.png"
                            : "experience.webp";

                /**
                 * Store the public API URL rather than Base64 in `image`.
                 * This keeps normal experience responses lightweight.
                 */
                experience.image = `/api/experiences/${experience._id.toString()}/image`;

                await experience.save();

                return reply.send({
                    success: true,
                    data: {
                        id: experience._id.toString(),
                        image: experience.image,
                        mimeType: experience.imageMimeType,
                        size: imageBuffer.length,
                    },
                });
            } catch (error) {
                request.log.error(
                    error,
                    "[Experience Image] Failed to process image",
                );

                return reply.code(400).send({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Invalid image payload.",
                });
            }
        },
    );

    // ---------------------------------------------------------------------------
    // [GET] /api/experiences/:id/image
    //
    // Public endpoint consumed by the frontend <img> element.
    // ---------------------------------------------------------------------------

    fastify.get<{
        Params: { id: string };
    }>(
        "/:id/image",
        async (request, reply) => {
            const { id } = request.params;

            if (!mongoose.isValidObjectId(id)) {
                return reply.code(400).send({
                    success: false,
                    message: "Invalid experience id.",
                });
            }

            const experience = await Experience.findById(id).select(
                "+imageData +imageMimeType",
            );

            if (!experience) {
                return reply.code(404).send({
                    success: false,
                    message: "Experience not found.",
                });
            }

            if (!experience.imageData || !experience.imageMimeType) {
                return reply.code(404).send({
                    success: false,
                    message: "Experience image not found.",
                });
            }

            reply.type(experience.imageMimeType);
            reply.header(
                "Cache-Control",
                "public, max-age=3600, stale-while-revalidate=86400",
            );

            return reply.send(experience.imageData);
        },
    );

    // ---------------------------------------------------------------------------
    // [DELETE] /api/experiences/:id
    // ---------------------------------------------------------------------------

    fastify.delete<{
        Params: { id: string };
    }>(
        "/:id",
        {
            preHandler: [authenticateAdmin],
        },
        deleteExperience,
    );
}