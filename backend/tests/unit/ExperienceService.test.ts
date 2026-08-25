import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type {
    ExperienceRepository,
} from '../../src/repositories/ExperienceRepository';

import {
    ExperienceService,
} from '../../src/services/ExperienceService';

import {
    NotFoundError,
} from '../../src/errors/AppError';

type MockRepository = {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

describe(
    'ExperienceService',
    () => {
        let service: ExperienceService;
        let repository: MockRepository;

        const createdAt =
            new Date(
                '2026-01-01T10:00:00.000Z',
            );

        const updatedAt =
            new Date(
                '2026-02-01T10:00:00.000Z',
            );

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
                new ExperienceService(
                    repository as unknown as ExperienceRepository,
                );
        });

        it(
            'getAllExperiences returns mapped DTOs',
            async () => {
                repository.findAll
                    .mockResolvedValue([
                        {
                            _id: {
                                toString:
                                    () =>
                                        'exp-1',
                            },

                            role:
                                'Senior Developer',

                            company:
                                'CodeForge',

                            description:
                                'Backend engineering',

                            technologies: [
                                'TypeScript',
                                'Fastify',
                            ],

                            startDate:
                                new Date(
                                    '2024-01-01T00:00:00.000Z',
                                ),

                            endDate:
                                new Date(
                                    '2025-01-01T00:00:00.000Z',
                                ),

                            current:
                                false,

                            image:
                                '/image.png',

                            createdAt,

                            updatedAt,
                        },
                    ]);

                const result =
                    await service.getAllExperiences(
                        2,
                        5,
                    );

                expect(
                    repository.findAll,
                ).toHaveBeenCalledWith(
                    2,
                    5,
                );

                expect(result).toHaveLength(
                    1,
                );

                expect(result[0]).toEqual({
                    id:
                        'exp-1',

                    role:
                        'Senior Developer',

                    company:
                        'CodeForge',

                    description:
                        'Backend engineering',

                    technologies: [
                        'TypeScript',
                        'Fastify',
                    ],

                    startDate:
                        '2024-01-01T00:00:00.000Z',

                    endDate:
                        '2025-01-01T00:00:00.000Z',

                    current:
                        false,

                    image:
                        '/image.png',

                    createdAt,

                    updatedAt,
                });
            },
        );

        it(
            'getAllExperiences uses default pagination',
            async () => {
                repository.findAll
                    .mockResolvedValue([]);

                const result =
                    await service.getAllExperiences();

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
            'getExperienceById returns mapped DTO',
            async () => {
                repository.findById
                    .mockResolvedValue({
                        _id: {
                            toString:
                                () =>
                                    'exp-2',
                        },

                        role:
                            'Developer',

                        company:
                            'Acme',

                        description:
                            'Full-stack development',

                        technologies: [],

                        startDate:
                            '2025-03-01',

                        current:
                            true,

                        createdAt,

                        updatedAt,
                    });

                const result =
                    await service.getExperienceById(
                        'exp-2',
                    );

                expect(
                    repository.findById,
                ).toHaveBeenCalledWith(
                    'exp-2',
                );

                expect(result).toEqual({
                    id:
                        'exp-2',

                    role:
                        'Developer',

                    company:
                        'Acme',

                    description:
                        'Full-stack development',

                    technologies: [],

                    startDate:
                        '2025-03-01',

                    endDate:
                        undefined,

                    current:
                        true,

                    image:
                        undefined,

                    createdAt,

                    updatedAt,
                });
            },
        );

        it(
            'getExperienceById supports string ids',
            async () => {
                repository.findById
                    .mockResolvedValue({
                        id:
                            'experience-name',

                        role:
                            'Engineer',

                        company:
                            'Company',

                        description:
                            'Description',

                        startDate:
                            '2025-01-01',

                        createdAt,

                        updatedAt,
                    });

                const result =
                    await service.getExperienceById(
                        'experience-name',
                    );

                expect(result.id)
                    .toBe(
                        'experience-name',
                    );
            },
        );

        it(
            'getExperienceById throws NotFoundError when missing',
            async () => {
                repository.findById
                    .mockResolvedValue(
                        null,
                    );

                await expect(
                    service.getExperienceById(
                        'missing',
                    ),
                ).rejects.toThrow(
                    NotFoundError,
                );
            },
        );

        it(
            'createExperience returns mapped DTO',
            async () => {
                const input = {
                    role:
                        'Developer',

                    company:
                        'CodeForge',

                    description:
                        'Working on backend',

                    technologies: [
                        'Node.js',
                    ],

                    startDate:
                        '2026-01-01',

                    current:
                        true,

                    image:
                        '/image.png',
                };

                repository.create
                    .mockResolvedValue({
                        _id: {
                            toString:
                                () =>
                                    'created-1',
                        },

                        ...input,

                        createdAt,

                        updatedAt,
                    });

                const result =
                    await service.createExperience(
                        input,
                    );

                expect(
                    repository.create,
                ).toHaveBeenCalledWith(
                    input,
                );

                expect(result.id)
                    .toBe('created-1');

                expect(
                    result.startDate,
                ).toBe('2026-01-01');
            },
        );

        it(
            'updateExperience returns mapped DTO',
            async () => {
                const input = {
                    role:
                        'Lead Developer',
                };

                repository.update
                    .mockResolvedValue({
                        _id: {
                            toString:
                                () =>
                                    'updated-1',
                        },

                        role:
                            'Lead Developer',

                        company:
                            'CodeForge',

                        description:
                            'Updated',

                        technologies: [
                            'TypeScript',
                        ],

                        startDate:
                            new Date(
                                '2026-01-01T00:00:00.000Z',
                            ),

                        endDate:
                            null,

                        current:
                            true,

                        createdAt,

                        updatedAt,
                    });

                const result =
                    await service.updateExperience(
                        'updated-1',
                        input,
                    );

                expect(
                    repository.update,
                ).toHaveBeenCalledWith(
                    'updated-1',
                    input,
                );

                expect(result).toMatchObject({
                    id:
                        'updated-1',

                    role:
                        'Lead Developer',

                    endDate:
                        null,
                });
            },
        );

        it(
            'updateExperience throws NotFoundError when missing',
            async () => {
                repository.update
                    .mockResolvedValue(
                        null,
                    );

                await expect(
                    service.updateExperience(
                        'missing',
                        {
                            role:
                                'Unknown',
                        },
                    ),
                ).rejects.toThrow(
                    NotFoundError,
                );
            },
        );

        it(
            'deleteExperience succeeds when repository deletes',
            async () => {
                repository.delete
                    .mockResolvedValue({
                        _id: 'deleted',
                    });

                await expect(
                    service.deleteExperience(
                        'deleted',
                    ),
                ).resolves.toBeUndefined();

                expect(
                    repository.delete,
                ).toHaveBeenCalledWith(
                    'deleted',
                );
            },
        );

        it(
            'deleteExperience throws NotFoundError when missing',
            async () => {
                repository.delete
                    .mockResolvedValue(
                        null,
                    );

                await expect(
                    service.deleteExperience(
                        'missing',
                    ),
                ).rejects.toThrow(
                    NotFoundError,
                );
            },
        );

        it(
            'preserves null endDate',
            async () => {
                repository.findById
                    .mockResolvedValue({
                        _id: {
                            toString:
                                () =>
                                    'active',
                        },

                        role:
                            'Engineer',

                        company:
                            'Company',

                        description:
                            'Current role',

                        startDate:
                            new Date(
                                '2026-01-01T00:00:00.000Z',
                            ),

                        endDate:
                            null,

                        current:
                            true,

                        createdAt,

                        updatedAt,
                    });

                const result =
                    await service.getExperienceById(
                        'active',
                    );

                expect(
                    result.endDate,
                ).toBeNull();
            },
        );

        it(
            'throws when a persistence document has no id',
            async () => {
                repository.findById
                    .mockResolvedValue({
                        role:
                            'Engineer',

                        company:
                            'Company',

                        description:
                            'Invalid document',

                        startDate:
                            '2026-01-01',

                        createdAt,

                        updatedAt,
                    });

                await expect(
                    service.getExperienceById(
                        'invalid',
                    ),
                ).rejects.toThrow(
                    'Experience document is missing an identifier.',
                );
            },
        );
    },
);