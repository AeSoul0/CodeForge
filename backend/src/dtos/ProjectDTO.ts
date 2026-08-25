/**
 * @file backend/src/dtos/ProjectDTO.ts
 * @description Data Transfer Objects used by the Project API.
 */

/**
 * Payload accepted when creating a project.
 */
export interface CreateProjectDTO {
    titolo: string;
    role?: string;
    descrizione: string;
    descrizioneLunga?: string;
    tecnologie: string[];
    categoria?: string;
    categorie?: string[];
    linkGithub?: string;
    image?: string;
    experienceId?: string;
}

/**
 * Payload accepted when updating an existing project.
 *
 * `regenerateAI` is an API-only control flag and is never persisted.
 */
export interface UpdateProjectDTO {
    titolo?: string;
    role?: string;
    descrizione?: string;
    descrizioneLunga?: string;
    tecnologie?: string[];
    categoria?: string;
    categorie?: string[];
    linkGithub?: string | null;
    image?: string | null;
    experienceId?: string | null;
    regenerateAI?: boolean;
}

/**
 * Project representation returned by the backend.
 */
export interface ProjectResponse {
    id: string;
    titolo: string;
    role?: string;
    descrizione: string;
    descrizioneLunga?: string;
    tecnologie: string[];
    categoria?: string;
    categorie?: string[];
    linkGithub?: string | null;
    image?: string | null;
    experienceId?: string | null;
    experienceImage?: string | null;
    createdAt: Date;
    updatedAt: Date;
}