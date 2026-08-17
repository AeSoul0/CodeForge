/**
 * @file backend/src/dtos/ExperienceDTO.ts
 * @description Data Transfer Objects (DTO) and TypeScript interfaces.
 */

export interface CreateExperienceDTO {
    role: string;
    company: string;
    description: string;
    technologies?: string[];
    startDate: string;
    endDate?: string | null;
    current?: boolean;
    image?: string | null;
}

export interface UpdateExperienceDTO {
    role?: string;
    company?: string;
    description?: string;
    technologies?: string[];
    startDate?: string;
    endDate?: string | null;
    current?: boolean;
    image?: string | null;
}

export interface ExperienceResponse {
    id: string;
    role: string;
    company: string;
    description: string;
    technologies?: string[];
    startDate: string;
    endDate?: string | null;

    /**
     * Indicates whether the experience is currently active.
     */
    current?: boolean;

    /**
     * Public API URL used by the frontend to load the image.
     *
     * Example:
     * /api/experiences/<id>/image
     */
    image?: string | null;

    createdAt: Date;
    updatedAt: Date;
}