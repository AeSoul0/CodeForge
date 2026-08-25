import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type {
    ProjectRepository,
} from '../../src/repositories/ProjectRepository';

import {
    ProjectService,
} from '../../src/services/ProjectService';

import {
    NotFoundError,
    AppError,
} from '../../src/errors/AppError';

describe('ProjectService', () => {
    let service: ProjectService;

    let repository: {
        findAll: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        repository = {
            findAll: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        service =
            new ProjectService(
                repository as unknown as ProjectRepository,
            );
    });

    it(
        'getAllProjects returns mapped DTOs',
        async () => {
            const createdAt =
                new Date();

            const updatedAt =
                new Date();

            const fake = [
                {
                    _id: 'id1',
                    titolo: 't',
                    role: 'r',
                    descrizione: 'd',
                    descrizioneLunga: 'dl',
                    tecnologie: [],
                    categoria: 'c',
                    categorie: [],
                    linkGithub: '',
                    image: '',
                    createdAt,
                    updatedAt,
                },
            ];

            repository.findAll
                .mockResolvedValue(fake);

            const result =
                await service.getAllProjects(
                    1,
                    10,
                );

            expect(
                repository.findAll,
            ).toHaveBeenCalledWith(
                1,
                10,
            );

            expect(result).toHaveLength(1);
            expect(result[0]?.id)
                .toBe('id1');
            expect(result[0]?.titolo)
                .toBe('t');
        },
    );

    it(
        'getProjectById returns DTO when found',
        async () => {
            const project = {
                _id: 'p1',
                titolo: 'x',
                role: 'y',
                descrizione: 'z',
                descrizioneLunga: '',
                tecnologie: [],
                categoria: '',
                categorie: [],
                linkGithub: '',
                image: '',
                createdAt:
                    new Date(),
                updatedAt:
                    new Date(),
            };

            repository.findById
                .mockResolvedValue(
                    project,
                );

            const result =
                await service.getProjectById(
                    'p1',
                );

            expect(
                repository.findById,
            ).toHaveBeenCalledWith(
                'p1',
            );

            expect(result.id)
                .toBe('p1');
        },
    );

    it(
        'getProjectById throws NotFoundError when missing',
        async () => {
            repository.findById
                .mockResolvedValue(
                    null,
                );

            await expect(
                service.getProjectById(
                    'missing',
                ),
            ).rejects.toThrow(
                NotFoundError,
            );
        },
    );

    it(
        'createProject returns DTO on success',
        async () => {
            const created = {
                _id: 'new',
                titolo: 'n',
                role: '',
                descrizione: '',
                descrizioneLunga: '',
                tecnologie: [],
                categoria: '',
                categorie: [],
                linkGithub: '',
                image: '',
                createdAt:
                    new Date(),
                updatedAt:
                    new Date(),
            };

            const input = {
                titolo: 'n',
                descrizione: '',
                tecnologie: [],
            };

            repository.create
                .mockResolvedValue(
                    created,
                );

            const result =
                await service.createProject(
                    input,
                );

            expect(
                repository.create,
            ).toHaveBeenCalledWith(
                input,
            );

            expect(result.id)
                .toBe('new');
        },
    );

    it(
        'createProject throws AppError on failure',
        async () => {
            const input = {
                titolo: 'n',
                descrizione: '',
                tecnologie: [],
            };

            repository.create
                .mockResolvedValue(
                    null,
                );

            await expect(
                service.createProject(
                    input,
                ),
            ).rejects.toThrow(
                AppError,
            );
        },
    );

    it(
        'updateProject returns DTO when updated',
        async () => {
            const updated = {
                _id: 'u',
                titolo: 'u',
                tecnologie: [],
                categorie: [],
                createdAt:
                    new Date(),
                updatedAt:
                    new Date(),
            };

            const input = {
                titolo: 'u',
            };

            repository.update
                .mockResolvedValue(
                    updated,
                );

            const result =
                await service.updateProject(
                    'u',
                    input,
                );

            expect(
                repository.update,
            ).toHaveBeenCalledWith(
                'u',
                input,
            );

            expect(result.id)
                .toBe('u');
        },
    );

    it(
        'updateProject throws NotFoundError when not found',
        async () => {
            repository.update
                .mockResolvedValue(
                    null,
                );

            await expect(
                service.updateProject(
                    'missing',
                    {},
                ),
            ).rejects.toThrow(
                NotFoundError,
            );
        },
    );

    it(
        'deleteProject succeeds when repo returns truthy',
        async () => {
            repository.delete
                .mockResolvedValue(
                    true,
                );

            await expect(
                service.deleteProject(
                    'del',
                ),
            ).resolves.toBeUndefined();

            expect(
                repository.delete,
            ).toHaveBeenCalledWith(
                'del',
            );
        },
    );

    it(
        'deleteProject throws NotFoundError when repo returns falsy',
        async () => {
            repository.delete
                .mockResolvedValue(
                    false,
                );

            await expect(
                service.deleteProject(
                    'missing',
                ),
            ).rejects.toThrow(
                NotFoundError,
            );
        },
    );
});