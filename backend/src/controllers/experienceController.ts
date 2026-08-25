/**
 * @file backend/src/controllers/experienceController.ts
 * @description Controller handling incoming HTTP requests and responses.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import type { CreateExperienceDTO, UpdateExperienceDTO } from '../dtos/ExperienceDTO.ts';
import type { ExperienceService } from '../services/ExperienceService.ts';
import { auditLogger } from '../utils/auditLogger';
import { triggerVercelDeploy } from '../utils/vercel';

let experienceServiceInstance: ExperienceService | null = null;
async function getExperienceService(): Promise<ExperienceService> {
  if (!experienceServiceInstance) {
    const mod = await import('../services/ExperienceService.ts');
    experienceServiceInstance = new mod.ExperienceService();
  }
  return experienceServiceInstance;
}


export async function getExperiences(request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const { page = 1, limit = 10 } = request.query;
    const service = await getExperienceService();
    const experiences = await service.getAllExperiences(Number(page), Number(limit));
    reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    return reply.send({ success: true, data: experiences });
}

// removed duplicate import


export async function createExperience(
    request: FastifyRequest<{ Body: CreateExperienceDTO }>,
    reply: FastifyReply
) {
    const newExperience = await getExperienceService().createExperience(request.body);
    
    // Audit Log
    auditLogger.log({
        requestId: request.id as string,
        action: 'CREATE_EXPERIENCE',
        resource: 'Experience',
        resourceId: newExperience.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Trigger Vercel deploy
    triggerVercelDeploy();

    return reply.status(201).send({ success: true, data: newExperience });
}

export async function updateExperience(
    request: FastifyRequest<{ Params: { name: string }; Body: UpdateExperienceDTO }>,
    reply: FastifyReply
) {
    const { name } = request.params;
    const updatedExp = await getExperienceService().updateExperience(name, request.body);

    auditLogger.log({
        requestId: request.id as string,
        action: 'UPDATE_EXPERIENCE',
        resource: 'Experience',
        resourceId: updatedExp.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Trigger Vercel deploy
    triggerVercelDeploy();

    return reply.send({ success: true, data: updatedExp });
}

export async function updateExperienceImage(
    request: FastifyRequest<{ Params: { name: string }; Body: { image: string | null } }>,
    reply: FastifyReply
) {
    const { name } = request.params;
    const updatedExp = await getExperienceService().updateExperience(name, { image: request.body.image });

    auditLogger.log({
        requestId: request.id as string,
        action: 'UPDATE_EXPERIENCE_IMAGE',
        resource: 'Experience',
        resourceId: updatedExp.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    return reply.send({ success: true, data: updatedExp });
}

export async function deleteExperience(
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
) {
    const { name } = request.params;
    await getExperienceService().deleteExperience(name);

    // Audit Log
    auditLogger.log({
        requestId: request.id as string,
        action: 'DELETE_EXPERIENCE',
        resource: 'Experience',
        resourceId: name,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    // Trigger Vercel deploy
    triggerVercelDeploy();

    return reply.send({ success: true, message: 'Experience successfully deleted.' });
}