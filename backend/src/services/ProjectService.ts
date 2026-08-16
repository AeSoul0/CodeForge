import { ProjectRepository } from '../repositories/ProjectRepository';
import { CreateProjectDTO, UpdateProjectDTO, ProjectResponse } from '../dtos/ProjectDTO';
import { NotFoundError } from '../errors/AppError';

export class ProjectService {
    private repository: ProjectRepository;

    constructor() {
        this.repository = new ProjectRepository();
    }

    private mapToDTO(project: any): ProjectResponse {
        return {
            id: project._id.toString(),
            titolo: project.titolo,
            descrizione: project.descrizione,
            tecnologie: project.tecnologie || [],
            categoria: project.categoria,
            linkGithub: project.linkGithub,
            image: project.image,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };
    }

    async getAllProjects(page: number = 1, limit: number = 10): Promise<ProjectResponse[]> {
        const projects = await this.repository.findAll(page, limit);
        return projects.map(this.mapToDTO);
    }

    async getProjectById(id: string): Promise<ProjectResponse> {
        const project = await this.repository.findById(id);
        if (!project) throw new NotFoundError('Project');
        return this.mapToDTO(project);
    }

    async createProject(data: CreateProjectDTO): Promise<ProjectResponse> {
        const newProject = await this.repository.create(data);
        return this.mapToDTO(newProject);
    }

    async updateProject(id: string, data: UpdateProjectDTO): Promise<ProjectResponse> {
        // Ensure it exists
        await this.getProjectById(id);
        
        const updatedProject = await this.repository.update(id, data);
        if (!updatedProject) throw new NotFoundError('Project');
        return this.mapToDTO(updatedProject);
    }

    async deleteProject(id: string): Promise<void> {
        // Ensure it exists
        await this.getProjectById(id);
        await this.repository.delete(id);
    }
}
