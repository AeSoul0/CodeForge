/**
 * @file backend/src/repositories/ExperienceRepository.ts
 * @description Database repository for interacting with MongoDB.
 */

import Experience from '../models/Experiences';

import type {
    CreateExperienceDTO,
    UpdateExperienceDTO,
} from '../dtos/ExperienceDTO';

import {
    DatabaseError,
} from '../errors/AppError';

export class ExperienceRepository {
    async findAll(
        page: number = 1,
        limit: number = 10,
    ) {
        const maxLimit = Math.min(
            Math.max(limit, 1),
            50,
        );

        const currentPage =
            Math.max(page, 1);

        const skip =
            (currentPage - 1) * maxLimit;

        try {
            return await Experience.find()
                .select('-__v')
                .sort({
                    startDate: -1,
                })
                .skip(skip)
                .limit(maxLimit)
                .lean();
        } catch {
            throw new DatabaseError(
                'Failed to fetch experiences from database',
            );
        }
    }

    async findById(
        id: string,
    ) {
        try {
            const isValidId =
                /^[0-9a-fA-F]{24}$/.test(id);

            const query = isValidId
                ? { _id: id }
                : { company: id };

            return await Experience.findOne(
                query,
            )
                .select('-__v')
                .lean();
        } catch {
            throw new DatabaseError(
                'Failed to fetch experience from database',
            );
        }
    }

    async create(
        data: CreateExperienceDTO,
    ) {
        try {
            const experience =
                new Experience(data);

            return await experience.save();
        } catch {
            throw new DatabaseError(
                'Failed to create experience in database',
            );
        }
    }

    async update(
        id: string,
        data: UpdateExperienceDTO,
    ) {
        try {
            const isValidId =
                /^[0-9a-fA-F]{24}$/.test(id);

            const query = isValidId
                ? { _id: id }
                : { company: id };

            return await Experience
                .findOneAndUpdate(
                    query,
                    data,
                    {
                        returnDocument:
                            'after',
                        runValidators:
                            true,
                    },
                )
                .lean();
        } catch {
            throw new DatabaseError(
                'Failed to update experience in database',
            );
        }
    }

    async delete(
        id: string,
    ) {
        try {
            const isValidId =
                /^[0-9a-fA-F]{24}$/.test(id);

            const query = isValidId
                ? { _id: id }
                : { company: id };

            return await Experience
                .findOneAndDelete(
                    query,
                )
                .lean();
        } catch {
            throw new DatabaseError(
                'Failed to delete experience from database',
            );
        }
    }
}