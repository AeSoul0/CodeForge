/**
 * @file backend/src/controllers/experienceController.ts
 * @description Controller handling incoming HTTP requests and responses.
 */

import type {
    FastifyReply,
    FastifyRequest,
} from 'fastify';

import type {
    CreateExperienceDTO,
    UpdateExperienceDTO,
} from '../dtos/ExperienceDTO';

import {
    ExperienceService,
} from '../services/ExperienceService';

import { auditLogger } from '../utils/auditLogger';
import { triggerVercelDeploy } from '../utils/vercel';

const experienceService =
    new ExperienceService();

function getActor(
    request: FastifyRequest,
): string {
    const user = request.user as
        | { username?: string }
        | undefined;

    return user?.username ?? 'admin';
}

export async function getExperiences(
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

    const experiences =
        await experienceService.getAllExperiences(
            Number(page),
            Number(limit),
        );

    reply.header(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=86400',
    );

    return reply.send({
        success: true,
        data: experiences,
    });
}

export async function createExperience(
    request: FastifyRequest<{
        Body: CreateExperienceDTO;
    }>,
    reply: FastifyReply,
) {
    const newExperience =
        await experienceService.createExperience(
            request.body,
        );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            'CREATE_EXPERIENCE',
        resource:
            'Experience',
        resourceId:
            newExperience.id,
        result:
            'success',
        actor:
            getActor(request),
    });

    void triggerVercelDeploy();

    return reply
        .status(201)
        .send({
            success: true,
            data: newExperience,
        });
}

export async function updateExperience(
    request: FastifyRequest<{
        Params: {
            name: string;
        };
        Body: UpdateExperienceDTO;
    }>,
    reply: FastifyReply,
) {
    const {
        name,
    } = request.params;

    const updatedExperience =
        await experienceService.updateExperience(
            name,
            request.body,
        );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            'UPDATE_EXPERIENCE',
        resource:
            'Experience',
        resourceId:
            updatedExperience.id,
        result:
            'success',
        actor:
            getActor(request),
    });

    void triggerVercelDeploy();

    return reply.send({
        success: true,
        data: updatedExperience,
    });
}

export async function updateExperienceImage(
    request: FastifyRequest<{
        Params: {
            name: string;
        };
        Body: {
            image: string | null;
        };
    }>,
    reply: FastifyReply,
) {
    const {
        name,
    } = request.params;

    const updatedExperience =
        await experienceService.updateExperience(
            name,
            {
                image:
                    request.body.image,
            },
        );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            'UPDATE_EXPERIENCE_IMAGE',
        resource:
            'Experience',
        resourceId:
            updatedExperience.id,
        result:
            'success',
        actor:
            getActor(request),
    });

    return reply.send({
        success: true,
        data: updatedExperience,
    });
}

export async function deleteExperience(
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

    await experienceService.deleteExperience(
        name,
    );

    auditLogger.log({
        requestId:
            request.id as string,
        action:
            'DELETE_EXPERIENCE',
        resource:
            'Experience',
        resourceId:
            name,
        result:
            'success',
        actor:
            getActor(request),
    });

    void triggerVercelDeploy();

    return reply.send({
        success: true,
        message:
            'Experience successfully deleted.',
    });
}