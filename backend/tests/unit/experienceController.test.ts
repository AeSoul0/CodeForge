import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type {
    FastifyReply,
} from 'fastify';

const {
    experienceServiceMock,
    triggerVercelDeployMock,
    auditLoggerMock,
} = vi.hoisted(() => {
    const experienceServiceMock = {
        getAllExperiences:
            vi.fn(),

        createExperience:
            vi.fn(),

        updateExperience:
            vi.fn(),

        deleteExperience:
            vi.fn(),
    };

    return {
        experienceServiceMock,
        triggerVercelDeployMock:
            vi.fn(),
        auditLoggerMock: {
            log: vi.fn(),
        },
    };
});

vi.mock(
    '../../src/services/ExperienceService',
    () => ({
        ExperienceService:
            class MockExperienceService {
                getAllExperiences =
                    experienceServiceMock
                        .getAllExperiences;

                createExperience =
                    experienceServiceMock
                        .createExperience;

                updateExperience =
                    experienceServiceMock
                        .updateExperience;

                deleteExperience =
                    experienceServiceMock
                        .deleteExperience;
            },
    }),
);

vi.mock(
    '../../src/utils/vercel',
    () => ({
        triggerVercelDeploy:
            triggerVercelDeployMock,
    }),
);

vi.mock(
    '../../src/utils/auditLogger',
    () => ({
        auditLogger:
            auditLoggerMock,
    }),
);

import * as controller
    from '../../src/controllers/experienceController';

function mockReply(): FastifyReply {
    return {
        header:
            vi.fn().mockReturnThis(),

        send:
            vi.fn().mockReturnThis(),

        status:
            vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;
}

describe(
    'experienceController',
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            'getExperiences returns paginated list with cache header',
            async () => {
                const experiences = [
                    {
                        id: 'e1',
                    },
                ];

                experienceServiceMock
                    .getAllExperiences
                    .mockResolvedValue(
                        experiences,
                    );

                const request = {
                    query: {},
                } as unknown as Parameters<
                    typeof controller.getExperiences
                >[0];

                const reply =
                    mockReply();

                await controller
                    .getExperiences(
                        request,
                        reply,
                    );

                expect(
                    experienceServiceMock
                        .getAllExperiences,
                ).toHaveBeenCalledWith(
                    1,
                    10,
                );

                expect(
                    reply.header,
                ).toHaveBeenCalledWith(
                    'Cache-Control',
                    expect.any(String),
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success: true,
                    data:
                        experiences,
                });
            },
        );

        it(
            'createExperience creates and triggers deploy',
            async () => {
                const experience = {
                    id: 'e2',
                };

                const body = {
                    role:
                        'Developer',

                    company:
                        'Example',

                    description:
                        'Description',

                    technologies:
                        [],

                    startDate:
                        '2026-01',

                    current:
                        true,
                };

                experienceServiceMock
                    .createExperience
                    .mockResolvedValue(
                        experience,
                    );

                const request = {
                    id: 'request-1',
                    body,
                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.createExperience
                >[0];

                const reply =
                    mockReply();

                await controller
                    .createExperience(
                        request,
                        reply,
                    );

                expect(
                    experienceServiceMock
                        .createExperience,
                ).toHaveBeenCalledWith(
                    body,
                );

                expect(
                    triggerVercelDeployMock,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    auditLoggerMock.log,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action:
                            'CREATE_EXPERIENCE',

                        resource:
                            'Experience',

                        resourceId:
                            experience.id,

                        result:
                            'success',

                        actor:
                            'admin',
                    }),
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    201,
                );
            },
        );

        it(
            'updateExperience updates and triggers deploy',
            async () => {
                const experience = {
                    id: 'e3',
                };

                const body = {
                    role:
                        'Senior Developer',
                };

                experienceServiceMock
                    .updateExperience
                    .mockResolvedValue(
                        experience,
                    );

                const request = {
                    id: 'request-2',

                    params: {
                        name:
                            'Old Company',
                    },

                    body,

                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.updateExperience
                >[0];

                const reply =
                    mockReply();

                await controller
                    .updateExperience(
                        request,
                        reply,
                    );

                expect(
                    experienceServiceMock
                        .updateExperience,
                ).toHaveBeenCalledWith(
                    'Old Company',
                    body,
                );

                expect(
                    triggerVercelDeployMock,
                ).toHaveBeenCalledTimes(
                    1,
                );
            },
        );

        it(
            'updateExperienceImage updates image',
            async () => {
                const experience = {
                    id: 'e4',
                };

                experienceServiceMock
                    .updateExperience
                    .mockResolvedValue(
                        experience,
                    );

                const request = {
                    id: 'request-3',

                    params: {
                        name:
                            'Old Company',
                    },

                    body: {
                        image:
                            'img.png',
                    },

                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.updateExperienceImage
                >[0];

                const reply =
                    mockReply();

                await controller
                    .updateExperienceImage(
                        request,
                        reply,
                    );

                expect(
                    experienceServiceMock
                        .updateExperience,
                ).toHaveBeenCalledWith(
                    'Old Company',
                    {
                        image:
                            'img.png',
                    },
                );
            },
        );

        it(
            'deleteExperience removes and triggers deploy',
            async () => {
                experienceServiceMock
                    .deleteExperience
                    .mockResolvedValue(
                        undefined,
                    );

                const request = {
                    id: 'request-4',

                    params: {
                        name:
                            'rem',
                    },

                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.deleteExperience
                >[0];

                const reply =
                    mockReply();

                await controller
                    .deleteExperience(
                        request,
                        reply,
                    );

                expect(
                    experienceServiceMock
                        .deleteExperience,
                ).toHaveBeenCalledWith(
                    'rem',
                );

                expect(
                    triggerVercelDeployMock,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    auditLoggerMock.log,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action:
                            'DELETE_EXPERIENCE',

                        resource:
                            'Experience',

                        resourceId:
                            'rem',

                        result:
                            'success',

                        actor:
                            'admin',
                    }),
                );
            },
        );
    },
);