/**
 * @file backend/src/controllers/projectController.ts
 * @description Controller handling incoming HTTP requests and responses.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService } from '../services/ProjectService';
import { CreateProjectDTO, UpdateProjectDTO } from '../dtos/ProjectDTO';
import { auditLogger } from '../utils/auditLogger';

const projectService = new ProjectService();

export async function getProjects(request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const { page = 1, limit = 10 } = request.query;
    const projects = await projectService.getAllProjects(Number(page), Number(limit));
    return reply.send({ success: true, data: projects });
}

import { triggerVercelDeploy } from '../utils/vercel';

import { processProjectAI } from '../utils/ai';

export async function createProject(
    request: FastifyRequest<{ Body: CreateProjectDTO }>,
    reply: FastifyReply
) {
    const newProject = await projectService.createProject(request.body);
    
    // Audit Log
    auditLogger.log({
        requestId: request.id as string,
        action: 'CREATE_PROJECT',
        resource: 'Project',
        resourceId: newProject.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Run AI description generation in background
    processProjectAI(newProject.id);

    // Trigger Vercel deploy (Note: The AI script also triggers deploy after finishing, but we trigger here to update the card first)
    triggerVercelDeploy();

    return reply.status(201).send({ success: true, data: newProject });
}

export async function updateProject(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateProjectDTO }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const updatedProject = await projectService.updateProject(id, request.body);

    // Audit Log
    auditLogger.log({
        requestId: request.id as string,
        action: 'UPDATE_PROJECT',
        resource: 'Project',
        resourceId: updatedProject.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Trigger Vercel deploy
    triggerVercelDeploy();

    return reply.send({ success: true, data: updatedProject });
}

export async function deleteProject(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    await projectService.deleteProject(id);

    // Audit Log
    auditLogger.log({
        requestId: request.id as string,
        action: 'DELETE_PROJECT',
        resource: 'Project',
        resourceId: id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Trigger Vercel deploy
    triggerVercelDeploy();

    return reply.send({ success: true, message: 'Project successfully deleted.' });
}