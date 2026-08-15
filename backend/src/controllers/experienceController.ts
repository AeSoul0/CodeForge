/**
 * @file backend/src/controllers/experienceController.ts
 * @description Controller layer for the Experiences resource.
 *
 * Handles retrieval, creation, full updates, image updates, and
 * deletion of experience records while keeping database access
 * isolated from the route definitions.
 */

import {
    FastifyRequest,
    FastifyReply,
} from "fastify";

import mongoose from "mongoose";
import Experience from "../models/Experiences";

/**
 * Shape of the payload accepted when creating an experience.
 */
interface CreateExperiencePayload {
    role: string;
    company: string;
    description: string;
    technologies?: string[];
    startDate: string | Date;
    endDate?: string | Date | null;
    current?: boolean;
    image?: string | null;
}

/**
 * Shape of the payload accepted when partially updating
 * an existing experience.
 *
 * All fields are optional because PATCH only changes the
 * properties supplied by the client.
 */
interface UpdateExperiencePayload {
    role?: string;
    company?: string;
    description?: string;
    technologies?: string[];
    startDate?: string | Date;
    endDate?: string | Date | null;
    current?: boolean;
    image?: string | null;
}

/**
 * Shape of the payload accepted when updating an experience image.
 */
interface UpdateExperienceImagePayload {
    image?: string | null;
}

/**
 * Route parameters containing an experience identifier.
 */
interface ExperienceIdParams {
    id: string;
}

/**
 * Retrieves all experiences from MongoDB.
 *
 * Records are sorted by startDate in descending order so that
 * the most recent experience appears first.
 */
export const getExperiences = async (
    _request: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const experiences = await Experience
            .find()
            .sort({ startDate: -1 })
            .lean();

        return reply.send(experiences);
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Creates a new experience record in MongoDB.
 *
 * Request validation is performed at the route level before
 * this controller is executed.
 */
export const createExperience = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const experienceData =
            request.body as CreateExperiencePayload;

        const newExperience =
            await Experience.create(
                experienceData,
            );

        return reply.status(201).send({
            success: true,
            message:
                "Experience created successfully.",
            data: newExperience,
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Updates an existing experience using only the fields
 * provided in the PATCH request body.
 *
 * This endpoint supports partial updates, so omitted fields
 * remain unchanged in MongoDB.
 */
export const updateExperience = async (
    request: FastifyRequest<{
        Params: ExperienceIdParams;
        Body: UpdateExperiencePayload;
    }>,
    reply: FastifyReply,
) => {
    try {
        const { id } = request.params;
        const updates = request.body;

        /**
         * Validate the MongoDB ObjectId before querying the database.
         */
        if (
            !mongoose.Types.ObjectId.isValid(
                id,
            )
        ) {
            return reply.status(400).send({
                success: false,
                error: "Invalid experience ID.",
            });
        }

        /**
         * Update only the fields supplied by the PATCH request.
         *
         * runValidators ensures the Mongoose schema rules are
         * still applied to the modified values.
         */
        const experience =
            await Experience.findByIdAndUpdate(
                id,
                updates,
                {
                    new: true,
                    runValidators: true,
                },
            );

        if (!experience) {
            return reply.status(404).send({
                success: false,
                error: "Experience not found.",
            });
        }

        return reply.send({
            success: true,
            message:
                "Experience updated successfully.",
            data: experience,
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Updates only the image associated with an existing experience.
 *
 * This endpoint intentionally updates only the image field so that
 * other experience data cannot be accidentally overwritten.
 */
export const updateExperienceImage = async (
    request: FastifyRequest<{
        Params: ExperienceIdParams;
        Body: UpdateExperienceImagePayload;
    }>,
    reply: FastifyReply,
) => {
    try {
        const { id } = request.params;
        const { image } = request.body;

        /**
         * Validate the MongoDB ObjectId before querying the database.
         */
        if (
            !mongoose.Types.ObjectId.isValid(
                id,
            )
        ) {
            return reply.status(400).send({
                success: false,
                error: "Invalid experience ID.",
            });
        }

        /**
         * Update only the image field and return the updated document.
         */
        const experience =
            await Experience.findByIdAndUpdate(
                id,
                {
                    image: image ?? null,
                },
                {
                    new: true,
                    runValidators: true,
                },
            );

        if (!experience) {
            return reply.status(404).send({
                success: false,
                error: "Experience not found.",
            });
        }

        return reply.send({
            success: true,
            message:
                "Experience image updated successfully.",
            data: experience,
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Deletes an experience from MongoDB.
 *
 * The entire document is removed permanently.
 */
export const deleteExperience = async (
    request: FastifyRequest<{
        Params: ExperienceIdParams;
    }>,
    reply: FastifyReply,
) => {
    try {
        const { id } = request.params;

        /**
         * Validate the MongoDB ObjectId before attempting deletion.
         */
        if (
            !mongoose.Types.ObjectId.isValid(
                id,
            )
        ) {
            return reply.status(400).send({
                success: false,
                error: "Invalid experience ID.",
            });
        }

        /**
         * Remove the experience document from MongoDB.
         */
        const deletedExperience =
            await Experience.findByIdAndDelete(
                id,
            );

        if (!deletedExperience) {
            return reply.status(404).send({
                success: false,
                error: "Experience not found.",
            });
        }

        return reply.send({
            success: true,
            message:
                "Experience deleted successfully.",
            data: {
                _id: deletedExperience._id,
            },
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};