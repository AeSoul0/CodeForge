/**
 * @file backend/src/dtos/ProjectDTO.ts
 * @description Data Transfer Objects used by the Project API.
 */

/**
 * Payload accepted when creating a project.
 */
export interface CreateProjectDTO {
    titolo: string;
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
 * `regenerateAI` is an API control flag and is intentionally not persisted
 * in MongoDB. It tells the controller whether the AI-generated technical
 * documentation should be regenerated after the project update.
 */
export interface UpdateProjectDTO {
    titolo?: string;
    descrizione?: string;
    descrizioneLunga?: string;
    tecnologie?: string[];
    categoria?: string;
    categorie?: string[];
    linkGithub?: string | null;
    image?: string | null;
    experienceId?: string | null;

    /**
     * When true, regenerate the AI-generated architectural documentation
     * after applying the project update.
     */
    regenerateAI?: boolean;
}

/**
 * Project representation returned by the backend.
 */
export interface ProjectResponse {
    id: string;
    titolo: string;
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