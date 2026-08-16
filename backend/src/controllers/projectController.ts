/**
 * @file backend/src/controllers/projectController.ts
 * @description HTTP controllers for the Project resource.
 *
 * Controllers handle HTTP concerns and delegate persistence/business logic
 * to the appropriate services.
 */

import {
    FastifyReply,
    FastifyRequest,
} from 'fastify';

import {
    CreateProjectDTO,
    UpdateProjectDTO,
} from '../dtos/ProjectDTO';

import { ProjectService } from '../services/ProjectService';

import { auditLogger } from '../utils/auditLogger';

import {
    processProjectAI,
} from '../utils/ai';

import {
    triggerVercelDeploy,
} from '../utils/vercel';

/**
 * Shared project service instance.
 */
const projectService =
    new ProjectService();

// ============================================================
// GET PROJECTS
// ============================================================

/**
 * Return the public project collection.
 */
export async function getProjects(
    request: FastifyRequest<{
        Querystring: {
            page?: number;
            limit?: number;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        page = 1,
        limit = 10,
    } = request.query;

    const projects =
        await projectService.getAllProjects(
            Number(page),
            Number(limit),
        );

    return reply.send({
        success: true,
        data: projects,
    });
}

// ============================================================
// CREATE PROJECT
// ============================================================

/**
 * Create a new project.
 *
 * AI generation starts automatically after the project has been persisted.
 * The AI service is responsible for triggering a deployment once the
 * generated documentation has been successfully saved.
 */
export async function createProject(
    request: FastifyRequest<{
        Body: CreateProjectDTO;
    }>,
    reply: FastifyReply,
) {
    const newProject =
        await projectService.createProject(
            request.body,
        );

    auditLogger.log({
        requestId: request.id as string,

        action: 'CREATE_PROJECT',

        resource: 'Project',

        resourceId: newProject.id,

        result: 'success',

        actor: request.user
            ? (request.user as any).username
            : 'admin',
    });

    /**
     * Generate the AI documentation in the background.
     *
     * `force` remains false because a newly-created project has no existing
     * documentation yet.
     *
     * The AI service will persist the generated Markdown and trigger the
     * deployment after successful completion.
     */
    void processProjectAI(
        newProject.id,
        false,
        true,
    );

    return reply.status(201).send({
        success: true,
        data: newProject,
    });
}

// ============================================================
// UPDATE PROJECT
// ============================================================

/**
 * Update an existing project.
 *
 * `regenerateAI` is an API-only control flag:
 *
 * - false/undefined:
 *   Update the project normally and keep the existing AI documentation.
 *
 * - true:
 *   Update the project first, then explicitly regenerate the AI
 *   documentation in the background.
 *
 * The flag itself is never persisted to MongoDB.
 */
export async function updateProject(
    request: FastifyRequest<{
        Params: {
            id: string;
        };

        Body: UpdateProjectDTO;
    }>,
    reply: FastifyReply,
) {
    const {
        id,
    } = request.params;

    /**
     * Extract the AI control flag before sending the remaining fields
     * to ProjectService.
     *
     * This prevents `regenerateAI` from becoming a MongoDB field.
     */
    const {
        regenerateAI = false,
        ...projectData
    } = request.body;

    /**
     * Persist the actual project changes.
     */
    const updatedProject =
        await projectService.updateProject(
            id,
            projectData,
        );

    auditLogger.log({
        requestId: request.id as string,

        action: regenerateAI
            ? 'UPDATE_PROJECT_REGENERATE_AI'
            : 'UPDATE_PROJECT',

        resource: 'Project',

        resourceId: updatedProject.id,

        result: 'success',

        actor: request.user
            ? (request.user as any).username
            : 'admin',
    });

    // ========================================================
    // OPTIONAL AI REGENERATION
    // ========================================================

    if (regenerateAI) {
        /**
         * Force regeneration because the administrator explicitly
         * requested a new architectural analysis.
         *
         * The AI service:
         * - generates the new content,
         * - saves it to MongoDB,
         * - triggers the Vercel deployment after successful persistence.
         */
        void processProjectAI(
            id,
            true,
            true,
        );

        /**
         * The HTTP request succeeds immediately because the expensive
         * LLM call runs asynchronously.
         */
        return reply.status(202).send({
            success: true,

            data: updatedProject,

            message:
                'Project updated successfully. AI documentation regeneration started in the background.',
        });
    }

    // ========================================================
    // NORMAL UPDATE
    // ========================================================

    /**
     * No AI regeneration was requested.
     *
     * Deploy the normal project update immediately.
     */
    await triggerVercelDeploy();

    return reply.send({
        success: true,
        data: updatedProject,
    });
}

// ============================================================
// DELETE PROJECT
// ============================================================

/**
 * Delete an existing project.
 */
export async function deleteProject(
    request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        id,
    } = request.params;

    await projectService.deleteProject(
        id,
    );

    auditLogger.log({
        requestId: request.id as string,

        action: 'DELETE_PROJECT',

        resource: 'Project',

        resourceId: id,

        result: 'success',

        actor: request.user
            ? (request.user as any).username
            : 'admin',
    });

    await triggerVercelDeploy();

    return reply.send({
        success: true,

        message:
            'Project successfully deleted.',
    });
}

// ============================================================
// FORCE AI REGENERATION
// ============================================================

/**
 * Force AI regeneration without changing the project fields.
 *
 * This endpoint remains useful when you simply want to regenerate the
 * documentation without modifying the project metadata.
 */
export async function generateAIForProject(
    request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        id,
    } = request.params;

    const project =
        await projectService.getProjectById(
            id,
        );

    if (!project) {
        return reply.status(404).send({
            success: false,

            message:
                'Project not found.',
        });
    }

    /**
     * Force regeneration even when descrizioneLunga already exists.
     */
    void processProjectAI(
        id,
        true,
        true,
    );

    return reply.status(202).send({
        success: true,

        message:
            'AI documentation regeneration started in the background.',
    });
}