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
    current?: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
