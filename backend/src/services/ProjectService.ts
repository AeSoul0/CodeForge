/**
 * @file backend/src/services/ProjectService.ts
 * @description Service layer implementing core business logic.
 */

import { ProjectRepository } from '../repositories/ProjectRepository';
import { CreateProjectDTO, UpdateProjectDTO, ProjectResponse } from '../dtos/ProjectDTO';
import { AppError } from '../errors/AppError';

export class ProjectService {
    private repository: ProjectRepository;

    constructor() {
        this.repository = new ProjectRepository();
    }

    private mapToDTO(project: any): ProjectResponse {
        let expId = null;
        let expImg = null;

        if (project.experienceId) {
            // Check if experienceId is populated
            if (typeof project.experienceId === 'object' && project.experienceId._id) {
                expId = project.experienceId._id.toString();
                expImg = project.experienceId.image || null;
            } else {
                expId = project.experienceId.toString();
            }
        }

        return {
            id: project._id ? project._id.toString() : project.id,
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
            updatedAt: project.updatedAt
        };
    }

    async getAllProjects(page: number = 1, limit: number = 10): Promise<ProjectResponse[]> {
        const projects = await this.repository.findAll(page, limit);
        return projects.map((p) => this.mapToDTO(p));
    }

    async getProjectById(id: string): Promise<ProjectResponse> {
        const project = await this.repository.findById(id);
        if (!project) {
            throw new AppError('Project not found', 404);
        }
        return this.mapToDTO(project);
    }

    async createProject(data: CreateProjectDTO): Promise<ProjectResponse> {
        const newProject = await this.repository.create(data);
        if (!newProject) {
            throw new AppError('Failed to create project', 500);
        }
        return this.mapToDTO(newProject);
    }

    async updateProject(id: string, data: UpdateProjectDTO): Promise<ProjectResponse> {
        const updatedProject = await this.repository.update(id, data);
        if (!updatedProject) {
            throw new AppError('Project not found or could not be updated', 404);
        }
        return this.mapToDTO(updatedProject);
    }

    async deleteProject(id: string): Promise<void> {
        const deleted = await this.repository.delete(id);
        if (!deleted) {
            throw new AppError('Project not found or could not be deleted', 404);
        }
    }
}
