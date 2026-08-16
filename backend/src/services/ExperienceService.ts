import { ExperienceRepository } from '../repositories/ExperienceRepository';
import { CreateExperienceDTO, UpdateExperienceDTO, ExperienceResponse } from '../dtos/ExperienceDTO';
import { NotFoundError } from '../errors/AppError';

export class ExperienceService {
    private repository: ExperienceRepository;

    constructor() {
        this.repository = new ExperienceRepository();
    }

    private mapToDTO(exp: any): ExperienceResponse {
        return {
            id: exp._id.toString(),
            role: exp.role,
            company: exp.company,
            description: exp.description,
            technologies: exp.technologies || [],
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: exp.current,
            image: exp.image,
            createdAt: exp.createdAt,
            updatedAt: exp.updatedAt
        };
    }

    async getAllExperiences(page: number = 1, limit: number = 10): Promise<ExperienceResponse[]> {
        const experiences = await this.repository.findAll(page, limit);
        return experiences.map(this.mapToDTO);
    }

    async getExperienceById(id: string): Promise<ExperienceResponse> {
        const experience = await this.repository.findById(id);
        if (!experience) throw new NotFoundError('Experience');
        return this.mapToDTO(experience);
    }

    async createExperience(data: CreateExperienceDTO): Promise<ExperienceResponse> {
        const newExperience = await this.repository.create(data);
        return this.mapToDTO(newExperience);
    }

    async updateExperience(id: string, data: UpdateExperienceDTO): Promise<ExperienceResponse> {
        await this.getExperienceById(id);
        
        const updatedExperience = await this.repository.update(id, data);
        if (!updatedExperience) throw new NotFoundError('Experience');
        return this.mapToDTO(updatedExperience);
    }

    async deleteExperience(id: string): Promise<void> {
        await this.getExperienceById(id);
        await this.repository.delete(id);
    }
}
