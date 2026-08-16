export interface CreateProjectDTO {
    titolo: string;
    descrizione: string;
    tecnologie: string[];
    categoria?: string;
    linkGithub?: string;
    image?: string;
}

export interface UpdateProjectDTO {
    titolo?: string;
    descrizione?: string;
    tecnologie?: string[];
    categoria?: string;
    linkGithub?: string | null;
    image?: string | null;
}

export interface ProjectResponse {
    id: string;
    titolo: string;
    descrizione: string;
    tecnologie: string[];
    categoria?: string;
    linkGithub?: string | null;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
