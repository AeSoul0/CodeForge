/**
 * @file backend/src/repositories/ProjectRepository.ts
 * @description Database repository for interacting with MongoDB.
 */

import Project, { IProject } from '../models/Projects';
import { CreateProjectDTO, UpdateProjectDTO } from '../dtos/ProjectDTO';
import { DatabaseError } from '../errors/AppError';

export class ProjectRepository {
    async findAll(page: number = 1, limit: number = 10) {
        const maxLimit = Math.min(limit, 50);
        const skip = (Math.max(page, 1) - 1) * maxLimit;
        try {
            return await Project.find()
                .populate('experienceId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(maxLimit)
                .lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch projects from database');
        }
    }

    async findById(id: string) {
        try {
            return await Project.findById(id).populate('experienceId').lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch project from database');
        }
    }

    async create(data: CreateProjectDTO) {
        try {
            const project = new Project(data);
            await project.save();
            return await Project.findById(project._id).populate('experienceId').lean();
        } catch (error) {
            throw new DatabaseError('Failed to create project in database');
        }
    }

    async update(id: string, data: UpdateProjectDTO) {
        try {
            return await Project.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).populate('experienceId').lean();
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
