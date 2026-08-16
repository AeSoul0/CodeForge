/**
 * @file backend/src/services/ProjectService.ts
 * @description Service layer implementing core project business logic.
 */

import { ProjectRepository } from '../repositories/ProjectRepository';
import {
    CreateProjectDTO,
    UpdateProjectDTO,
    ProjectResponse,
} from '../dtos/ProjectDTO';
import {
    AppError,
    NotFoundError,
} from '../errors/AppError';

export class ProjectService {
    private repository: ProjectRepository;

    constructor() {
        this.repository = new ProjectRepository();
    }

    /**
     * Maps a persistence-layer project document into the public API DTO.
     *
     * The mapper keeps database-specific fields such as ObjectId instances
     * out of the HTTP layer and normalizes populated experience references.
     */
    private mapToDTO(project: any): ProjectResponse {
        let expId = null;
        let expImg = null;

        if (project.experienceId) {
            // Handle populated experience documents.
            if (
                typeof project.experienceId === 'object' &&
                project.experienceId._id
            ) {
                expId = project.experienceId._id.toString();
                expImg = project.experienceId.image || null;
            } else {
                // Handle unpopulated ObjectId references.
                expId = project.experienceId.toString();
            }
        }

        return {
            id: project._id
                ? project._id.toString()
                : project.id,
            titolo: project.titolo,
            descrizione: project.descrizione,
            descrizioneLunga: project.descrizioneLunga,
            tecnologie: project.tecnologie || [],
            categoria: project.categoria,
            categorie: project.categorie || [],
            linkGithub: project.linkGithub,
            image: project.image,
            experienceId: expId,
            experienceImage: expImg,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };
    }

    /**
     * Returns a paginated collection of projects.
     */
    async getAllProjects(
        page: number = 1,
        limit: number = 10,
    ): Promise<ProjectResponse[]> {
        const projects = await this.repository.findAll(
            page,
            limit,
        );

        return projects.map((project) =>
            this.mapToDTO(project),
        );
    }

    /**
     * Retrieves a single project by its identifier.
     *
     * A dedicated NotFoundError is used so callers and the global
     * error handler can distinguish a missing resource from an
     * unexpected application failure.
     */
    async getProjectById(
        id: string,
    ): Promise<ProjectResponse> {
        const project =
            await this.repository.findById(id);

        if (!project) {
            throw new NotFoundError('Project');
        }

        return this.mapToDTO(project);
    }

    /**
     * Creates a new project and returns the normalized API representation.
     */
    async createProject(
        data: CreateProjectDTO,
    ): Promise<ProjectResponse> {
        const newProject =
            await this.repository.create(data);

        if (!newProject) {
            throw new AppError(
                'Failed to create project',
                500,
            );
        }

        return this.mapToDTO(newProject);
    }

    /**
     * Updates an existing project.
     *
     * Missing resources are represented with NotFoundError rather than
     * a generic 404 AppError, keeping the domain semantics explicit.
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
            throw new NotFoundError('Project');
        }

        return this.mapToDTO(updatedProject);
    }

    /**
     * Deletes an existing project.
     *
     * A missing project is treated as a domain-level not-found condition.
     */
    async deleteProject(
        id: string,
    ): Promise<void> {
        const deleted =
            await this.repository.delete(id);

        if (!deleted) {
            throw new NotFoundError('Project');
        }
    }
}