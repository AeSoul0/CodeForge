/**
 * @file backend/src/controllers/projectController.ts
 * @description Controller layer for the Projects resource.
 *
 * Handles retrieval, creation, partial updates, and deletion of
 * project records while keeping database access isolated from
 * the route definitions.
 *
 * Projects can belong to multiple macro-domain categories.
 */

import {
    FastifyRequest,
    FastifyReply,
} from "fastify";

import mongoose from "mongoose";
import Project from "../models/Projects";

/**
 * Shape of the payload accepted when creating a project.
 */
interface CreateProjectPayload {
    titolo: string;
    descrizione: string;
    tecnologie: string[];
    categorie?: string[];
    linkGithub?: string;
    image?: string;
}

/**
 * Shape of the payload accepted when partially updating a project.
 *
 * Every field is optional because PATCH operations are intended
 * to update only the values explicitly provided by the caller.
 */
interface UpdateProjectPayload {
    titolo?: string;
    descrizione?: string;
    tecnologie?: string[];
    categorie?: string[];
    linkGithub?: string | null;
    image?: string | null;
}

/**
 * Route parameters containing a project identifier.
 */
interface ProjectIdParams {
    id: string;
}

/**
 * Retrieves all projects from MongoDB.
 *
 * Projects are sorted by creation date in descending order so that
 * the newest project appears first.
 */
export const getProjects = async (
    _request: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const projects = await Project
            .find()
            .sort({ createdAt: -1 })
            .lean();

        return reply.send(projects);
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Creates a new project in MongoDB.
 *
 * Request validation is handled by the route schema before
 * this controller is executed.
 */
export const createProject = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    try {
        const projectData =
            request.body as CreateProjectPayload;

        const newProject =
            await Project.create(
                projectData,
            );

        return reply.status(201).send({
            success: true,
            message:
                "Project created successfully.",
            data: newProject,
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Partially updates an existing project.
 *
 * Only the fields included in the request body are modified.
 * Existing values remain untouched.
 */
export const updateProject = async (
    request: FastifyRequest<{
        Params: ProjectIdParams;
        Body: UpdateProjectPayload;
    }>,
    reply: FastifyReply,
) => {
    try {
        const { id } = request.params;

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
                error: "Invalid project ID.",
            });
        }

        const updateData =
            request.body as UpdateProjectPayload;

        /**
         * Remove undefined values so PATCH only modifies
         * fields explicitly provided by the caller.
         */
        const filteredUpdateData =
            Object.fromEntries(
                Object.entries(
                    updateData,
                ).filter(
                    ([, value]) =>
                        value !==
                        undefined,
                ),
            );

        if (
            Object.keys(
                filteredUpdateData,
            ).length === 0
        ) {
            return reply.status(400).send({
                success: false,
                error:
                    "No fields provided for update.",
            });
        }

        /**
         * Update the project and return the resulting document.
         *
         * runValidators ensures the Mongoose schema rules
         * are still applied to the updated fields.
         */
        const updatedProject =
            await Project.findByIdAndUpdate(
                id,
                filteredUpdateData,
                {
                    new: true,
                    runValidators: true,
                },
            );

        if (!updatedProject) {
            return reply.status(404).send({
                success: false,
                error: "Project not found.",
            });
        }

        return reply.send({
            success: true,
            message:
                "Project updated successfully.",
            data: updatedProject,
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};

/**
 * Deletes an existing project from MongoDB.
 *
 * The operation permanently removes the complete project document.
 */
export const deleteProject = async (
    request: FastifyRequest<{
        Params: ProjectIdParams;
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
                error: "Invalid project ID.",
            });
        }

        /**
         * Permanently delete the project from MongoDB.
         */
        const deletedProject =
            await Project.findByIdAndDelete(
                id,
            );

        if (!deletedProject) {
            return reply.status(404).send({
                success: false,
                error: "Project not found.",
            });
        }

        return reply.send({
            success: true,
            message:
                "Project deleted successfully.",
            data: {
                _id: deletedProject._id,
            },
        });
    } catch (error) {
        /**
         * Delegate unexpected errors to Fastify's global error handler.
         */
        throw error;
    }
};