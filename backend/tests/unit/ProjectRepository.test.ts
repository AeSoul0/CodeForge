import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    DatabaseError,
} from '../../src/errors/AppError';

const {
    ProjectMock,
    findMock,
    findOneMock,
    findByIdMock,
    findOneAndUpdateMock,
    findOneAndDeleteMock,
    saveMock,
} = vi.hoisted(() => {
    const saveMock = vi.fn();

    const findMock = {
        populate: vi.fn(),
        sort: vi.fn(),
        skip: vi.fn(),
        limit: vi.fn(),
        lean: vi.fn(),
    };

    const findOneMock = {
        populate: vi.fn(),
        lean: vi.fn(),
    };

    const findByIdMock = {
        populate: vi.fn(),
        lean: vi.fn(),
    };

    const findOneAndUpdateMock = {
        populate: vi.fn(),
        lean: vi.fn(),
    };

    const findOneAndDeleteMock = {
        lean: vi.fn(),
    };

    class MockProject {
        _id = 'project-id';

        constructor(
            public readonly data: unknown,
        ) {}

        save() {
            return saveMock.call(this);
        }
    }

    Object.assign(
        MockProject,
        {
            find: vi.fn(),
            findOne: vi.fn(),
            findById: vi.fn(),
            findOneAndUpdate: vi.fn(),
            findOneAndDelete: vi.fn(),
        },
    );

    return {
        ProjectMock: MockProject,
        findMock,
        findOneMock,
        findByIdMock,
        findOneAndUpdateMock,
        findOneAndDeleteMock,
        saveMock,
    };
});

vi.mock(
    '../../src/models/Projects',
    () => ({
        default:
            ProjectMock,
    }),
);

import Project from '../../src/models/Projects';

import {
    ProjectRepository,
} from '../../src/repositories/ProjectRepository';

describe(
    'ProjectRepository',
    () => {
        let repository:
            ProjectRepository;

        const model =
            Project as unknown as {
                find: ReturnType<typeof vi.fn>;
                findOne: ReturnType<typeof vi.fn>;
                findById: ReturnType<typeof vi.fn>;
                findOneAndUpdate:
                    ReturnType<typeof vi.fn>;
                findOneAndDelete:
                    ReturnType<typeof vi.fn>;
            };

        beforeEach(() => {
            vi.clearAllMocks();

            model.find =
                vi.fn().mockReturnValue(
                    findMock,
                );

            model.findOne =
                vi.fn().mockReturnValue(
                    findOneMock,
                );

            model.findById =
                vi.fn().mockReturnValue(
                    findByIdMock,
                );

            model.findOneAndUpdate =
                vi.fn().mockReturnValue(
                    findOneAndUpdateMock,
                );

            model.findOneAndDelete =
                vi.fn().mockReturnValue(
                    findOneAndDeleteMock,
                );

            findMock.populate
                .mockReturnValue(
                    findMock,
                );

            findMock.sort
                .mockReturnValue(
                    findMock,
                );

            findMock.skip
                .mockReturnValue(
                    findMock,
                );

            findMock.limit
                .mockReturnValue(
                    findMock,
                );

            findOneMock.populate
                .mockReturnValue(
                    findOneMock,
                );

            findByIdMock.populate
                .mockReturnValue(
                    findByIdMock,
                );

            findOneAndUpdateMock.populate
                .mockReturnValue(
                    findOneAndUpdateMock,
                );

            findMock.lean
                .mockResolvedValue(
                    [],
                );

            findOneMock.lean
                .mockResolvedValue(
                    null,
                );

            findByIdMock.lean
                .mockResolvedValue(
                    null,
                );

            findOneAndUpdateMock.lean
                .mockResolvedValue(
                    null,
                );

            findOneAndDeleteMock.lean
                .mockResolvedValue(
                    null,
                );

            saveMock.mockReset();
            saveMock.mockResolvedValue(
                undefined,
            );

            repository =
                new ProjectRepository();
        });

        it(
            'findAll queries pagination and sorting',
            async () => {
                const projects = [
                    {
                        _id:
                            'project-1',
                    },
                ];

                findMock.lean
                    .mockResolvedValue(
                        projects,
                    );

                const result =
                    await repository.findAll(
                        2,
                        20,
                    );

                expect(
                    model.find,
                ).toHaveBeenCalledWith();

                expect(
                    findMock.populate,
                ).toHaveBeenCalledWith(
                    'experienceId',
                );

                expect(
                    findMock.sort,
                ).toHaveBeenCalledWith({
                    createdAt: -1,
                    _id: -1,
                });

                expect(
                    findMock.skip,
                ).toHaveBeenCalledWith(
                    20,
                );

                expect(
                    findMock.limit,
                ).toHaveBeenCalledWith(
                    20,
                );

                expect(result).toEqual(
                    projects,
                );
            },
        );

        it(
            'findAll uses default pagination',
            async () => {
                await repository.findAll();

                expect(
                    findMock.skip,
                ).toHaveBeenCalledWith(
                    0,
                );

                expect(
                    findMock.limit,
                ).toHaveBeenCalledWith(
                    10,
                );
            },
        );

        it(
            'findAll clamps limit to 50',
            async () => {
                await repository.findAll(
                    1,
                    500,
                );

                expect(
                    findMock.limit,
                ).toHaveBeenCalledWith(
                    50,
                );
            },
        );

        it(
            'findAll normalizes negative page',
            async () => {
                await repository.findAll(
                    -4,
                    10,
                );

                expect(
                    findMock.skip,
                ).toHaveBeenCalledWith(
                    0,
                );
            },
        );

        it(
            'findAll wraps database errors',
            async () => {
                model.find =
                    vi.fn(() => {
                        throw new Error(
                            'database failure',
                        );
                    });

                await expect(
                    repository.findAll(),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );

        it(
            'findById uses _id for valid ObjectId',
            async () => {
                const project = {
                    _id:
                        'project-1',
                };

                findOneMock.lean
                    .mockResolvedValue(
                        project,
                    );

                const result =
                    await repository.findById(
                        '507f1f77bcf86cd799439011',
                    );

                expect(
                    model.findOne,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });

                expect(
                    findOneMock.populate,
                ).toHaveBeenCalledWith(
                    'experienceId',
                );

                expect(result)
                    .toEqual(project);
            },
        );

        it(
            'findById uses titolo for non ObjectId',
            async () => {
                await repository.findById(
                    'My Project',
                );

                expect(
                    model.findOne,
                ).toHaveBeenCalledWith({
                    titolo:
                        'My Project',
                });
            },
        );

        it(
            'findById wraps database errors',
            async () => {
                model.findOne =
                    vi.fn(() => {
                        throw new Error(
                            'database failure',
                        );
                    });

                await expect(
                    repository.findById(
                        'My Project',
                    ),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );

        it(
            'create saves and reloads project',
            async () => {
                const input = {
                    titolo:
                        'New Project',

                    descrizione:
                        'Description',

                    tecnologie: [],
                };

                const saved = {
                    _id:
                        'project-id',
                };

                const reloaded = {
                    _id:
                        'project-id',

                    titolo:
                        'New Project',
                };

                saveMock.mockResolvedValue(
                    saved,
                );

                findByIdMock.lean
                    .mockResolvedValue(
                        reloaded,
                    );

                const result =
                    await repository.create(
                        input,
                    );

                expect(
                    saveMock,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    model.findById,
                ).toHaveBeenCalledWith(
                    'project-id',
                );

                expect(
                    findByIdMock.populate,
                ).toHaveBeenCalledWith(
                    'experienceId',
                );

                expect(result).toEqual(
                    reloaded,
                );
            },
        );

        it(
            'create wraps database errors',
            async () => {
                saveMock.mockRejectedValue(
                    new Error(
                        'save failed',
                    ),
                );

                await expect(
                    repository.create({
                        titolo:
                            'Project',

                        descrizione:
                            'Description',

                        tecnologie: [],
                    }),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );

        it(
            'update uses _id for valid ObjectId',
            async () => {
                const updated = {
                    _id:
                        'updated',
                };

                findOneAndUpdateMock.lean
                    .mockResolvedValue(
                        updated,
                    );

                const data = {
                    titolo:
                        'Updated',
                };

                const result =
                    await repository.update(
                        '507f1f77bcf86cd799439011',
                        data,
                    );

                expect(
                    model.findOneAndUpdate,
                ).toHaveBeenCalledWith(
                    {
                        _id:
                            '507f1f77bcf86cd799439011',
                    },
                    data,
                    {
                        returnDocument:
                            'after',
                        runValidators:
                            true,
                    },
                );

                expect(result).toEqual(
                    updated,
                );
            },
        );

        it(
            'update uses titolo for non ObjectId',
            async () => {
                const data = {
                    titolo:
                        'Updated',
                };

                await repository.update(
                    'Old Project',
                    data,
                );

                expect(
                    model.findOneAndUpdate,
                ).toHaveBeenCalledWith(
                    {
                        titolo:
                            'Old Project',
                    },
                    data,
                    {
                        returnDocument:
                            'after',
                        runValidators:
                            true,
                    },
                );
            },
        );

        it(
            'update wraps database errors',
            async () => {
                model.findOneAndUpdate =
                    vi.fn(() => {
                        throw new Error(
                            'database failure',
                        );
                    });

                await expect(
                    repository.update(
                        'Old Project',
                        {
                            titolo:
                                'Updated',
                        },
                    ),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );

        it(
            'delete uses _id for valid ObjectId',
            async () => {
                const deleted = {
                    _id:
                        'deleted',
                };

                findOneAndDeleteMock.lean
                    .mockResolvedValue(
                        deleted,
                    );

                const result =
                    await repository.delete(
                        '507f1f77bcf86cd799439011',
                    );

                expect(
                    model.findOneAndDelete,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });

                expect(result).toEqual(
                    deleted,
                );
            },
        );

        it(
            'delete uses titolo for non ObjectId',
            async () => {
                await repository.delete(
                    'Old Project',
                );

                expect(
                    model.findOneAndDelete,
                ).toHaveBeenCalledWith({
                    titolo:
                        'Old Project',
                });
            },
        );

        it(
            'delete wraps database errors',
            async () => {
                model.findOneAndDelete =
                    vi.fn(() => {
                        throw new Error(
                            'database failure',
                        );
                    });

                await expect(
                    repository.delete(
                        'Old Project',
                    ),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );
    },
);