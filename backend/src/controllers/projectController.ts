/**
 * @file backend/src/controllers/projectController.ts
 * @description HTTP controllers for the Project resource.
 *
 * Controllers handle HTTP concerns and delegate business logic
 * to the ProjectService.
 */

import type {
    FastifyReply,
    FastifyRequest,
} from 'fastify';

import type {
    CreateProjectDTO,
    UpdateProjectDTO,
} from '../dtos/ProjectDTO';

import { ProjectService } from '../services/ProjectService';

import { auditLogger } from '../utils/auditLogger';
import { processProjectAI } from '../utils/ai';
import { triggerVercelDeploy } from '../utils/vercel';

const projectService = new ProjectService();

function getActor(
    request: FastifyRequest,
): string {
    const user = request.user as
        | { username?: string }
        | undefined;

    return user?.username ?? 'admin';
}

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

    reply.header(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=86400',
    );

    return reply.send({
        success: true,
        data: projects,
    });
}

/**
 * Create a new project.
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
        requestId:
            request.id as string,
        action:
            'CREATE_PROJECT',
        resource:
            'Project',
        resourceId:
            newProject.id,
        result:
            'success',
        actor:
            getActor(request),
    });

    void processProjectAI(
        newProject.id,
        false,
        true,
    );

    return reply
        .status(201)
        .send({
            success: true,
            data: newProject,
        });
}

/**
 * Update an existing project.
 *
 * `regenerateAI` is an API-only control flag
 * and is never persisted.
 */
export async function updateProject(
    request: FastifyRequest<{
        Params: {
            name: string;
        };
        Body: UpdateProjectDTO;
    }>,
    reply: FastifyReply,
) {
    const {
        name,
    } = request.params;

    const {
        regenerateAI = false,
        ...projectData
    } = request.body;

    const updatedProject =
        await projectService.updateProject(
            name,
            projectData,
        );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            regenerateAI
                ? 'UPDATE_PROJECT_REGENERATE_AI'
                : 'UPDATE_PROJECT',
        resource:
            'Project',
        resourceId:
            updatedProject.id,
        result:
            'success',
        actor:
            getActor(request),
    });

    if (regenerateAI) {
        void processProjectAI(
            updatedProject.id,
            true,
            true,
        );

        return reply
            .status(202)
            .send({
                success: true,
                data: updatedProject,
                message:
                    'Project updated successfully. AI documentation regeneration started in the background.',
            });
    }

    await triggerVercelDeploy();

    return reply.send({
        success: true,
        data: updatedProject,
    });
}

/**
 * Delete an existing project.
 */
export async function deleteProject(
    request: FastifyRequest<{
        Params: {
            name: string;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        name,
    } = request.params;

    await projectService.deleteProject(
        name,
    );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            'DELETE_PROJECT',
        resource:
            'Project',
        resourceId:
            name,
        result:
            'success',
        actor:
            getActor(request),
    });

    await triggerVercelDeploy();

    return reply.send({
        success: true,
        message:
            'Project successfully deleted.',
    });
}

/**
 * Force AI regeneration without modifying project fields.
 */
export async function generateAIForProject(
    request: FastifyRequest<{
        Params: {
            name: string;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        name,
    } = request.params;

    const project =
        await projectService.getProjectById(
            name,
        );

    void processProjectAI(
        project.id,
        true,
        true,
    );

    return reply
        .status(202)
        .send({
            success: true,
            message:
                'AI documentation regeneration started in the background.',
        });
}