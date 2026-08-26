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

function createProject(
    overrides: Record<string, unknown> = {},
) {
    return {
        _id: 'project-1',
        titolo: 'Project',
        role: 'Developer',
        descrizione: 'Description',
        descrizioneLunga:
            'Long description',
        tecnologie: [
            'TypeScript',
        ],
        categoria: 'Backend',
        categorie: [
            'Web',
        ],
        linkGithub:
            'https://github.com/example',
        image: '/project.png',
        createdAt:
            new Date(
                '2026-01-01T00:00:00.000Z',
            ),
        updatedAt:
            new Date(
                '2026-02-01T00:00:00.000Z',
            ),
        ...overrides,
    };
}

describe(
    'ProjectService',
    () => {
        let service: ProjectService;

        let repository: {
            findAll: ReturnType<
                typeof vi.fn
            >;

            findById: ReturnType<
                typeof vi.fn
            >;

            create: ReturnType<
                typeof vi.fn
            >;

            update: ReturnType<
                typeof vi.fn
            >;

            delete: ReturnType<
                typeof vi.fn
            >;
        };

        beforeEach(() => {
            vi.clearAllMocks();

            repository = {
                findAll:
                    vi.fn(),

                findById:
                    vi.fn(),

                create:
                    vi.fn(),

                update:
                    vi.fn(),

                delete:
                    vi.fn(),
            };

            service =
                new ProjectService(
                    repository as unknown as ProjectRepository,
                );
        });

        it(
            'getAllProjects returns mapped DTOs',
            async () => {
                const project =
                    createProject();

                repository.findAll
                    .mockResolvedValue([
                        project,
                    ]);

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

                expect(result).toHaveLength(
                    1,
                );

                expect(result[0])
                    .toMatchObject({
                        id:
                            'project-1',

                        titolo:
                            'Project',

                        role:
                            'Developer',

                        experienceId:
                            null,

                        experienceImage:
                            null,
                    });
            },
        );

        it(
            'getAllProjects uses default pagination',
            async () => {
                repository.findAll
                    .mockResolvedValue([]);

                const result =
                    await service.getAllProjects();

                expect(
                    repository.findAll,
                ).toHaveBeenCalledWith(
                    1,
                    10,
                );

                expect(result)
                    .toEqual([]);
            },
        );

        it(
            'maps populated experience with id and image',
            async () => {
                const project =
                    createProject({
                        experienceId: {
                            _id: {
                                toString:
                                    () =>
                                        'experience-1',
                            },

                            image:
                                '/experience.png',
                        },
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-1',
                    );

                expect(
                    result.experienceId,
                ).toBe(
                    'experience-1',
                );

                expect(
                    result.experienceImage,
                ).toBe(
                    '/experience.png',
                );
            },
        );

        it(
            'maps populated experience with null image',
            async () => {
                const project =
                    createProject({
                        experienceId: {
                            _id: {
                                toString:
                                    () =>
                                        'experience-2',
                            },

                            image:
                                null,
                        },
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-1',
                    );

                expect(
                    result.experienceId,
                ).toBe(
                    'experience-2',
                );

                expect(
                    result.experienceImage,
                ).toBeNull();
            },
        );

        it(
            'maps string experienceId',
            async () => {
                const project =
                    createProject({
                        experienceId:
                            'experience-string',
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-1',
                    );

                expect(
                    result.experienceId,
                ).toBe(
                    'experience-string',
                );

                expect(
                    result.experienceImage,
                ).toBeNull();
            },
        );

        it(
            'maps non-populated experience reference using toString',
            async () => {
                const project =
                    createProject({
                        experienceId: {
                            toString:
                                () =>
                                    'experience-reference',
                        },
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-1',
                    );

                expect(
                    result.experienceId,
                ).toBe(
                    'experience-reference',
                );

                expect(
                    result.experienceImage,
                ).toBeNull();
            },
        );

        it(
            'maps project id fallback when _id is absent',
            async () => {
                const project =
                    createProject({
                        _id:
                            undefined,

                        id:
                            'fallback-id',
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'fallback-id',
                    );

                expect(result.id)
                    .toBe(
                        'fallback-id',
                    );
            },
        );

        it(
            'throws when project has no identifier',
            async () => {
                const project =
                    createProject({
                        _id:
                            undefined,

                        id:
                            undefined,
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                await expect(
                    service.getProjectById(
                        'invalid',
                    ),
                ).rejects.toThrow(
                    'Project document is missing an identifier.',
                );
            },
        );

        it(
            'derives createdAt from legacy MongoDB ObjectId',
            async () => {
                const legacyDate =
                    new Date(
                        '2026-01-01T00:00:00.000Z',
                    );

                const project =
                    createProject({
                        _id: {
                            toString:
                                () =>
                                    'project-legacy',

                            getTimestamp:
                                () =>
                                    legacyDate,
                        },

                        createdAt:
                            undefined,

                        updatedAt:
                            undefined,
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-legacy',
                    );

                expect(
                    result.createdAt,
                ).toEqual(
                    legacyDate,
                );

                expect(
                    result.updatedAt,
                ).toEqual(
                    legacyDate,
                );
            },
        );

        it(
            'keeps explicit updatedAt when createdAt is legacy-derived',
            async () => {
                const legacyCreatedAt =
                    new Date(
                        '2026-01-01T00:00:00.000Z',
                    );

                const explicitUpdatedAt =
                    new Date(
                        '2026-02-01T00:00:00.000Z',
                    );

                const project =
                    createProject({
                        _id: {
                            toString:
                                () =>
                                    'project-legacy',

                            getTimestamp:
                                () =>
                                    legacyCreatedAt,
                        },

                        createdAt:
                            undefined,

                        updatedAt:
                            explicitUpdatedAt,
                    });

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-legacy',
                    );

                expect(
                    result.createdAt,
                ).toEqual(
                    legacyCreatedAt,
                );

                expect(
                    result.updatedAt,
                ).toEqual(
                    explicitUpdatedAt,
                );
            },
        );

        it(
            'getProjectById returns DTO when found',
            async () => {
                const project =
                    createProject();

                repository.findById
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await service.getProjectById(
                        'project-1',
                    );

                expect(
                    repository.findById,
                ).toHaveBeenCalledWith(
                    'project-1',
                );

                expect(result.id)
                    .toBe(
                        'project-1',
                    );
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
                const created =
                    createProject({
                        _id:
                            'new-project',

                        titolo:
                            'New Project',
                    });

                const input = {
                    titolo:
                        'New Project',

                    descrizione:
                        'Description',

                    tecnologie:
                        [],
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
                    .toBe(
                        'new-project',
                    );
            },
        );

        it(
            'createProject throws AppError when repository returns null',
            async () => {
                repository.create
                    .mockResolvedValue(
                        null,
                    );

                await expect(
                    service.createProject({
                        titolo:
                            'Project',

                        descrizione:
                            'Description',

                        tecnologie:
                            [],
                    }),
                ).rejects.toThrow(
                    AppError,
                );
            },
        );

        it(
            'updateProject returns DTO when updated',
            async () => {
                const updated =
                    createProject({
                        _id:
                            'updated-project',

                        titolo:
                            'Updated',
                    });

                const input = {
                    titolo:
                        'Updated',
                };

                repository.update
                    .mockResolvedValue(
                        updated,
                    );

                const result =
                    await service.updateProject(
                        'updated-project',
                        input,
                    );

                expect(
                    repository.update,
                ).toHaveBeenCalledWith(
                    'updated-project',
                    input,
                );

                expect(result.id)
                    .toBe(
                        'updated-project',
                    );
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
            'deleteProject succeeds when repository returns truthy',
            async () => {
                repository.delete
                    .mockResolvedValue(
                        true,
                    );

                await expect(
                    service.deleteProject(
                        'project-1',
                    ),
                ).resolves.toBeUndefined();

                expect(
                    repository.delete,
                ).toHaveBeenCalledWith(
                    'project-1',
                );
            },
        );

        it(
            'deleteProject throws NotFoundError when repository returns falsy',
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
    },
);