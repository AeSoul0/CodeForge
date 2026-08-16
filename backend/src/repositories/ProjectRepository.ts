import Project from '../models/Projects';
import { CreateProjectDTO, UpdateProjectDTO } from '../dtos/ProjectDTO';
import { DatabaseError } from '../errors/AppError';

export class ProjectRepository {
    async findAll(page: number = 1, limit: number = 10) {
        const maxLimit = Math.min(limit, 50);
        const skip = (Math.max(page, 1) - 1) * maxLimit;
        try {
            return await Project.find().select('-__v').sort({ createdAt: -1 }).skip(skip).limit(maxLimit).lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch projects from database');
        }
    }

    async findById(id: string) {
        try {
            return await Project.findById(id).select('-__v').lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch project from database');
        }
    }

    async create(data: CreateProjectDTO) {
        try {
            const project = new Project(data);
            return await project.save();
        } catch (error) {
            throw new DatabaseError('Failed to create project in database');
        }
    }

    async update(id: string, data: UpdateProjectDTO) {
        try {
            return await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
        } catch (error) {
            throw new DatabaseError('Failed to update project in database');
        }
    }

    async delete(id: string) {
        try {
            return await Project.findByIdAndDelete(id).lean();
        } catch (error) {
            throw new DatabaseError('Failed to delete project from database');
        }
    }
}
