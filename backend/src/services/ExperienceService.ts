/**
 * @file backend/src/services/ExperienceService.ts
 * @description Service layer implementing core business logic.
 */

import {
    ExperienceRepository,
} from '../repositories/ExperienceRepository';

import type {
    CreateExperienceDTO,
    UpdateExperienceDTO,
    ExperienceResponse,
} from '../dtos/ExperienceDTO';

import {
    NotFoundError,
} from '../errors/AppError';

type ExperiencePersistenceModel = {
    _id?: {
        toString(): string;
    };

    id?: string;

    role: string;

    company: string;

    description: string;

    technologies?: string[];

    startDate: Date | string;

    endDate?: Date | string | null;

    current?: boolean;

    image?: string | null;

    createdAt: Date;

    updatedAt: Date;
};

function normalizeDate(
    value: Date | string,
): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

function normalizeOptionalDate(
    value:
        | Date
        | string
        | null
        | undefined,
): string | null | undefined {
    if (value === null) {
        return null;
    }

    if (value === undefined) {
        return undefined;
    }

    return normalizeDate(value);
}

export class ExperienceService {
    constructor(
        private readonly repository:
            ExperienceRepository =
            new ExperienceRepository(),
    ) {}

    private mapToDTO(
        experience: ExperiencePersistenceModel,
    ): ExperienceResponse {
        const id =
            experience._id
                ?.toString() ??
            experience.id;

        if (!id) {
            throw new Error(
                'Experience document is missing an identifier.',
            );
        }

        return {
            id,

            role:
                experience.role,

            company:
                experience.company,

            description:
                experience.description,

            technologies:
                experience.technologies ??
                [],

            startDate:
                normalizeDate(
                    experience.startDate,
                ),

            endDate:
                normalizeOptionalDate(
                    experience.endDate,
                ),

            current:
                experience.current,

            image:
                experience.image,

            createdAt:
                experience.createdAt,

            updatedAt:
                experience.updatedAt,
        };
    }

    async getAllExperiences(
        page: number = 1,
        limit: number = 10,
    ): Promise<
        ExperienceResponse[]
    > {
        const experiences =
            await this.repository.findAll(
                page,
                limit,
            );

        return experiences.map(
            (experience) =>
                this.mapToDTO(
                    experience,
                ),
        );
    }

    async getExperienceById(
        id: string,
    ): Promise<ExperienceResponse> {
        const experience =
            await this.repository.findById(
                id,
            );

        if (!experience) {
            throw new NotFoundError(
                'Experience',
            );
        }

        return this.mapToDTO(
            experience,
        );
    }

    async createExperience(
        data: CreateExperienceDTO,
    ): Promise<ExperienceResponse> {
        const newExperience =
            await this.repository.create(
                data,
            );

        return this.mapToDTO(
            newExperience,
        );
    }

    async updateExperience(
        id: string,
        data: UpdateExperienceDTO,
    ): Promise<ExperienceResponse> {
        const updated =
            await this.repository.update(
                id,
                data,
            );

        if (!updated) {
            throw new NotFoundError(
                'Experience',
            );
        }

        return this.mapToDTO(
            updated,
        );
    }

    async deleteExperience(
        id: string,
    ): Promise<void> {
        const deleted =
            await this.repository.delete(
                id,
            );

        if (!deleted) {
            throw new NotFoundError(
                'Experience',
            );
        }
    }
}