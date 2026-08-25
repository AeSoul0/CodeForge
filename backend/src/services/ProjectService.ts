/**
 * @file backend/src/services/ProjectService.ts
 * @description Service layer implementing core project business logic.
 */

import {
    ProjectRepository,
} from '../repositories/ProjectRepository';

import type {
    CreateProjectDTO,
    UpdateProjectDTO,
    ProjectResponse,
} from '../dtos/ProjectDTO';

import {
    AppError,
    NotFoundError,
} from '../errors/AppError';

type PopulatedExperienceReference = {
    _id?: {
        toString(): string;
    };

    image?: string | null;

    toString(): string;
};

type ProjectPersistenceModel = {
    _id?: {
        toString(): string;
    };

    id?: string;

    titolo: string;

    role?: string;

    descrizione: string;

    descrizioneLunga?: string;

    tecnologie: string[];

    categoria?: string;

    categorie: string[];

    linkGithub?: string;

    image?: string;

    experienceId?:
        | PopulatedExperienceReference
        | string
        | null;

    createdAt?: Date;

    updatedAt?: Date;
};

function requireDate(
    value: Date | undefined,
    fieldName: string,
): Date {
    if (!value) {
        throw new Error(
            `Project document is missing ${fieldName}.`,
        );
    }

    return value;
}

export class ProjectService {
    constructor(
        private readonly repository:
            ProjectRepository =
            new ProjectRepository(),
    ) {}

    /**
     * Maps a persistence-layer project document into
     * the public API DTO.
     */
    private mapToDTO(
        project: ProjectPersistenceModel,
    ): ProjectResponse {
        let experienceId:
            string | null = null;

        let experienceImage:
            string | null = null;

        const experience =
            project.experienceId;

        if (experience) {
            if (
                typeof experience ===
                    'object' &&
                experience._id
            ) {
                experienceId =
                    experience._id.toString();

                experienceImage =
                    experience.image ??
                    null;
            } else if (
                typeof experience ===
                'string'
            ) {
                experienceId =
                    experience;
            } else {
                experienceId =
                    experience.toString();
            }
        }

        const id =
            project._id
                ?.toString() ??
            project.id;

        if (!id) {
            throw new Error(
                'Project document is missing an identifier.',
            );
        }

        return {
            id,

            titolo:
                project.titolo,

            role:
                project.role,

            descrizione:
                project.descrizione,

            descrizioneLunga:
                project.descrizioneLunga,

            tecnologie:
                project.tecnologie,

            categoria:
                project.categoria,

            categorie:
                project.categorie,

            linkGithub:
                project.linkGithub,

            image:
                project.image,

            experienceId,

            experienceImage,

            createdAt:
                requireDate(
                    project.createdAt,
                    'createdAt',
                ),

            updatedAt:
                requireDate(
                    project.updatedAt,
                    'updatedAt',
                ),
        };
    }

    /**
     * Returns a paginated collection of projects.
     */
    async getAllProjects(
        page: number = 1,
        limit: number = 10,
    ): Promise<
        ProjectResponse[]
    > {
        const projects =
            await this.repository.findAll(
                page,
                limit,
            );

        return projects.map(
            (project) =>
                this.mapToDTO(
                    project,
                ),
        );
    }

    /**
     * Retrieves a single project by its identifier.
     */
    async getProjectById(
        id: string,
    ): Promise<ProjectResponse> {
        const project =
            await this.repository.findById(
                id,
            );

        if (!project) {
            throw new NotFoundError(
                'Project',
            );
        }

        return this.mapToDTO(
            project,
        );
    }

    /**
     * Creates a new project.
     */
    async createProject(
        data: CreateProjectDTO,
    ): Promise<ProjectResponse> {
        const newProject =
            await this.repository.create(
                data,
            );

        if (!newProject) {
            throw new AppError(
                'Failed to create project',
                500,
            );
        }

        return this.mapToDTO(
            newProject,
        );
    }

    /**
     * Updates an existing project.
     */
    async updateProject(
        id: string,
        data: UpdateProjectDTO,
    ): Promise<ProjectResponse> {
        const updatedProject =
            await this.repository.update(
                id,
                data,
            );

        if (!updatedProject) {
            throw new NotFoundError(
                'Project',
            );
        }

        return this.mapToDTO(
            updatedProject,
        );
    }

    /**
     * Deletes an existing project.
     */
    async deleteProject(
        id: string,
    ): Promise<void> {
        const deleted =
            await this.repository.delete(
                id,
            );

        if (!deleted) {
            throw new NotFoundError(
                'Project',
            );
        }
    }
}