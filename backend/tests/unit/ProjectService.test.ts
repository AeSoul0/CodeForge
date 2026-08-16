/**
 * @file backend/tests/unit/ProjectService.test.ts
 * @description Unit/integration tests for ProjectService.
 *
 * These tests exercise the service against the configured MongoDB test
 * database to verify project lifecycle operations and domain-level errors.
 */

import {
    describe,
    it,
    expect,
} from 'vitest';

import mongoose from 'mongoose';

import {
    ProjectService,
} from '../../src/services/ProjectService';

import {
    NotFoundError,
} from '../../src/errors/AppError';

describe('ProjectService', () => {
    const service = new ProjectService();

    it('should create and retrieve a project', async () => {
        const payload = {
            titolo: 'Test Project',
            descrizione:
                'This is a test description longer than 10 chars',
            tecnologie: [
                'TypeScript',
                'Node.js',
            ],
        };

        const created =
            await service.createProject(payload);

        expect(created.id).toBeDefined();
        expect(created.titolo).toBe(
            'Test Project',
        );

        const fetched =
            await service.getProjectById(
                created.id,
            );

        expect(fetched.titolo).toBe(
            'Test Project',
        );
    });

    it('should throw NotFoundError for a non-existent project', async () => {
        // Generate a valid MongoDB ObjectId that is extremely unlikely
        // to reference an existing project in the test database.
        const fakeId =
            new mongoose.Types.ObjectId().toString();

        await expect(
            service.getProjectById(fakeId),
        ).rejects.toThrow(
            NotFoundError,
        );
    });

    it('should update an existing project', async () => {
        const payload = {
            titolo: 'Old Title',
            descrizione:
                'This is a test description longer than 10 chars',
            tecnologie: [],
        };

        const created =
            await service.createProject(
                payload,
            );

        const updated =
            await service.updateProject(
                created.id,
                {
                    titolo: 'New Title',
                },
            );

        expect(updated.titolo).toBe(
            'New Title',
        );

        expect(updated.descrizione).toBe(
            payload.descrizione,
        );
    });

    it('should delete a project', async () => {
        const payload = {
            titolo: 'To Be Deleted',
            descrizione:
                'This is a test description longer than 10 chars',
            tecnologie: [],
        };

        const created =
            await service.createProject(
                payload,
            );

        await service.deleteProject(
            created.id,
        );

        await expect(
            service.getProjectById(
                created.id,
            ),
        ).rejects.toThrow(
            NotFoundError,
        );
    });
});