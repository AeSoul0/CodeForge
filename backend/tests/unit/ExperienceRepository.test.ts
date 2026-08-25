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
    findMock,
    findOneMock,
    findOneAndUpdateMock,
    findOneAndDeleteMock,
    saveMock,
    ExperienceMock,
} = vi.hoisted(() => {
    const saveMock = vi.fn();

    const findMock = {
        select: vi.fn(),
        sort: vi.fn(),
        skip: vi.fn(),
        limit: vi.fn(),
        lean: vi.fn(),
    };

    const findOneMock = {
        select: vi.fn(),
        lean: vi.fn(),
    };

    const findOneAndUpdateMock = {
        lean: vi.fn(),
    };

    const findOneAndDeleteMock = {
        lean: vi.fn(),
    };

    class MockExperience {
        _id = 'experience-id';

        save() {
            return saveMock.call(this);
        }
    }

    Object.assign(
        MockExperience,
        {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneAndUpdate: vi.fn(),
            findOneAndDelete: vi.fn(),
        },
    );

    return {
        findMock,
        findOneMock,
        findOneAndUpdateMock,
        findOneAndDeleteMock,
        saveMock,
        ExperienceMock: MockExperience,
    };
});

vi.mock(
    '../../src/models/Experiences',
    () => ({
        default:
            ExperienceMock,
    }),
);

import Experience from '../../src/models/Experiences';

import {
    ExperienceRepository,
} from '../../src/repositories/ExperienceRepository';

describe(
    'ExperienceRepository',
    () => {
        let repository: ExperienceRepository;

        const model =
            Experience as unknown as {
                find: ReturnType<typeof vi.fn>;
                findOne: ReturnType<typeof vi.fn>;
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

            model.findOneAndUpdate =
                vi.fn().mockReturnValue(
                    findOneAndUpdateMock,
                );

            model.findOneAndDelete =
                vi.fn().mockReturnValue(
                    findOneAndDeleteMock,
                );

            findMock.select.mockReturnValue(
                findMock,
            );

            findMock.sort.mockReturnValue(
                findMock,
            );

            findMock.skip.mockReturnValue(
                findMock,
            );

            findMock.limit.mockReturnValue(
                findMock,
            );

            findOneMock.select.mockReturnValue(
                findOneMock,
            );

            findMock.lean.mockResolvedValue(
                [],
            );

            findOneMock.lean.mockResolvedValue(
                null,
            );

            findOneAndUpdateMock.lean
                .mockResolvedValue(null);

            findOneAndDeleteMock.lean
                .mockResolvedValue(null);

            saveMock.mockReset();
            saveMock.mockResolvedValue(
                undefined,
            );

            repository =
                new ExperienceRepository();
        });

        it(
            'findAll queries with pagination and sorting',
            async () => {
                const data = [
                    {
                        _id: 'experience-1',
                    },
                ];

                findMock.lean.mockResolvedValue(
                    data,
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
                    findMock.select,
                ).toHaveBeenCalledWith(
                    '-__v',
                );

                expect(
                    findMock.sort,
                ).toHaveBeenCalledWith({
                    startDate: -1,
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
                    data,
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
                    -5,
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
                model.find = vi.fn(() => {
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
                const result = {
                    _id:
                        '507f1f77bcf86cd799439011',
                };

                findOneMock.lean.mockResolvedValue(
                    result,
                );

                await expect(
                    repository.findById(
                        '507f1f77bcf86cd799439011',
                    ),
                ).resolves.toEqual(
                    result,
                );

                expect(
                    model.findOne,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });
            },
        );

        it(
            'findById uses company for non ObjectId',
            async () => {
                await repository.findById(
                    'CodeForge',
                );

                expect(
                    model.findOne,
                ).toHaveBeenCalledWith({
                    company: 'CodeForge',
                });
            },
        );

        it(
            'findById selects hidden version field',
            async () => {
                await repository.findById(
                    'CodeForge',
                );

                expect(
                    findOneMock.select,
                ).toHaveBeenCalledWith(
                    '-__v',
                );
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
                        'CodeForge',
                    ),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );

        it(
            'create constructs and saves experience',
            async () => {
                const input = {
                    role: 'Developer',
                    company: 'CodeForge',
                    description: 'Backend',
                    startDate: '2026-01-01',
                };

                const saved = {
                    _id: 'new-experience',
                    ...input,
                };

                saveMock.mockResolvedValue(
                    saved,
                );

                const result =
                    await repository.create(
                        input,
                    );

                expect(
                    ExperienceMock,
                ).toBeInstanceOf(
                    Function,
                );

                expect(
                    saveMock,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(result).toEqual(
                    saved,
                );
            },
        );

        it(
            'create wraps save errors',
            async () => {
                saveMock.mockRejectedValue(
                    new Error(
                        'save failed',
                    ),
                );

                await expect(
                    repository.create({
                        role: 'Developer',
                        company:
                            'CodeForge',
                        description:
                            'Backend',
                        startDate:
                            '2026-01-01',
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
                    _id: 'updated',
                };

                findOneAndUpdateMock.lean
                    .mockResolvedValue(
                        updated,
                    );

                const data = {
                    role:
                        'Lead Developer',
                };

                await expect(
                    repository.update(
                        '507f1f77bcf86cd799439011',
                        data,
                    ),
                ).resolves.toEqual(
                    updated,
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
            },
        );

        it(
            'update uses company for non ObjectId',
            async () => {
                const data = {
                    role:
                        'Lead Developer',
                };

                await repository.update(
                    'CodeForge',
                    data,
                );

                expect(
                    model.findOneAndUpdate,
                ).toHaveBeenCalledWith(
                    {
                        company:
                            'CodeForge',
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
                        'CodeForge',
                        {
                            role:
                                'Lead Developer',
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
                    _id: 'deleted',
                };

                findOneAndDeleteMock.lean
                    .mockResolvedValue(
                        deleted,
                    );

                await expect(
                    repository.delete(
                        '507f1f77bcf86cd799439011',
                    ),
                ).resolves.toEqual(
                    deleted,
                );

                expect(
                    model.findOneAndDelete,
                ).toHaveBeenCalledWith({
                    _id:
                        '507f1f77bcf86cd799439011',
                });
            },
        );

        it(
            'delete uses company for non ObjectId',
            async () => {
                await repository.delete(
                    'CodeForge',
                );

                expect(
                    model.findOneAndDelete,
                ).toHaveBeenCalledWith({
                    company:
                        'CodeForge',
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
                        'CodeForge',
                    ),
                ).rejects.toThrow(
                    DatabaseError,
                );
            },
        );
    },
);