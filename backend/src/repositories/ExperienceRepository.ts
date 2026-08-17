/**
 * @file backend/src/repositories/ExperienceRepository.ts
 * @description Database repository for interacting with MongoDB.
 */

import Experience from '../models/Experiences';
import { CreateExperienceDTO, UpdateExperienceDTO } from '../dtos/ExperienceDTO';
import { DatabaseError } from '../errors/AppError';

export class ExperienceRepository {
    async findAll(page: number = 1, limit: number = 10) {
        const maxLimit = Math.min(limit, 50);
        const skip = (Math.max(page, 1) - 1) * maxLimit;
        try {
            return await Experience.find().select('-__v').sort({ startDate: -1 }).skip(skip).limit(maxLimit).lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch experiences from database');
        }
    }

    async findById(id: string) {
        try {
            return await Experience.findById(id).select('-__v').lean();
        } catch (error) {
            throw new DatabaseError('Failed to fetch experience from database');
        }
    }

    async create(data: CreateExperienceDTO) {
        try {
            const experience = new Experience(data);
            return await experience.save();
        } catch (error) {
            throw new DatabaseError('Failed to create experience in database');
        }
    }

    async update(id: string, data: UpdateExperienceDTO) {
        try {
            return await Experience.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean();
        } catch (error) {
            throw new DatabaseError('Failed to update experience in database');
        }
    }

    async delete(id: string) {
        try {
            return await Experience.findByIdAndDelete(id).lean();
        } catch (error) {
            throw new DatabaseError('Failed to delete experience from database');
        }
    }
}
