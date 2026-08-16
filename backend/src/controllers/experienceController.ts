import { FastifyRequest, FastifyReply } from 'fastify';
import { ExperienceService } from '../services/ExperienceService';
import { CreateExperienceDTO, UpdateExperienceDTO } from '../dtos/ExperienceDTO';
import { auditLogger } from '../utils/auditLogger';

const experienceService = new ExperienceService();

export async function getExperiences(request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const { page = 1, limit = 10 } = request.query;
    const experiences = await experienceService.getAllExperiences(Number(page), Number(limit));
    return reply.send({ success: true, data: experiences });
}

export async function createExperience(
    request: FastifyRequest<{ Body: CreateExperienceDTO }>,
    reply: FastifyReply
) {
    const newExp = await experienceService.createExperience(request.body);
    
    auditLogger.log({
        requestId: request.id as string,
        action: 'CREATE_EXPERIENCE',
        resource: 'Experience',
        resourceId: newExp.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    return reply.status(201).send({ success: true, data: newExp });
}

export async function updateExperience(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateExperienceDTO }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const updatedExp = await experienceService.updateExperience(id, request.body);

    auditLogger.log({
        requestId: request.id as string,
        action: 'UPDATE_EXPERIENCE',
        resource: 'Experience',
        resourceId: updatedExp.id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    return reply.send({ success: true, data: updatedExp });
}

export async function updateExperienceImage(
    request: FastifyRequest<{ Params: { id: string }; Body: { image: string | null } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const updatedExp = await experienceService.updateExperience(id, { image: request.body.image });

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
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    await experienceService.deleteExperience(id);

    auditLogger.log({
        requestId: request.id as string,
        action: 'DELETE_EXPERIENCE',
        resource: 'Experience',
        resourceId: id,
        result: 'success',
        actor: request.user ? (request.user as any).username : 'admin'
    });

    return reply.send({ success: true, message: 'Experience successfully deleted.' });
}