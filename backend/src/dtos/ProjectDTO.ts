/**
 * @file backend/src/dtos/ProjectDTO.ts
 * @description Data Transfer Objects (DTO) and TypeScript interfaces.
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
}

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
