import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { FastifyReply } from 'fastify';

const {
    projectServiceMock,
    processProjectAIMock,
    triggerVercelDeployMock,
    auditLoggerMock,
} = vi.hoisted(() => {
    const projectServiceMock = {
        getAllProjects: vi.fn(),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        deleteProject: vi.fn(),
        getProjectById: vi.fn(),
    };

    class MockProjectService {
        getAllProjects =
            projectServiceMock.getAllProjects;

        createProject =
            projectServiceMock.createProject;

        updateProject =
            projectServiceMock.updateProject;

        deleteProject =
            projectServiceMock.deleteProject;

        getProjectById =
            projectServiceMock.getProjectById;
    }

    return {
        projectServiceMock,
        MockProjectService,
        processProjectAIMock: vi.fn(),
        triggerVercelDeployMock:
            vi.fn(),
        auditLoggerMock: {
            log: vi.fn(),
        },
    };
});

vi.mock(
    '../../src/services/ProjectService',
    () => ({
        ProjectService:
            class MockProjectService {
                getAllProjects =
                    projectServiceMock.getAllProjects;

                createProject =
                    projectServiceMock.createProject;

                updateProject =
                    projectServiceMock.updateProject;

                deleteProject =
                    projectServiceMock.deleteProject;

                getProjectById =
                    projectServiceMock.getProjectById;
            },
    }),
);

vi.mock(
    '../../src/utils/ai',
    () => ({
        processProjectAI:
            processProjectAIMock,
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
    from '../../src/controllers/projectController';

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
    'projectController',
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            'getProjects returns paginated list',
            async () => {
                const projects = [
                    {
                        id: 'p1',
                    },
                ];

                projectServiceMock
                    .getAllProjects
                    .mockResolvedValue(
                        projects,
                    );

                const request = {
                    query: {},
                } as unknown as Parameters<
                    typeof controller.getProjects
                >[0];

                const reply =
                    mockReply();

                await controller.getProjects(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .getAllProjects,
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
                    data: projects,
                });
            },
        );

        it(
            'createProject creates and triggers AI',
            async () => {
                const project = {
                    id: 'p2',
                };

                const body = {
                    titolo: 'Test',
                    descrizione:
                        'Description',
                    tecnologie: [],
                };

                projectServiceMock
                    .createProject
                    .mockResolvedValue(
                        project,
                    );

                const request = {
                    id: 'request-1',
                    body,
                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.createProject
                >[0];

                const reply =
                    mockReply();

                await controller.createProject(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .createProject,
                ).toHaveBeenCalledWith(
                    body,
                );

                expect(
                    processProjectAIMock,
                ).toHaveBeenCalledWith(
                    project.id,
                    false,
                    true,
                );

                expect(
                    auditLoggerMock.log,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action:
                            'CREATE_PROJECT',
                        resource:
                            'Project',
                        resourceId:
                            project.id,
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

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success: true,
                    data: project,
                });
            },
        );

        it(
            'updateProject updates and deploys',
            async () => {
                const project = {
                    id: 'p3',
                };

                const body = {
                    titolo: 'New',
                };

                projectServiceMock
                    .updateProject
                    .mockResolvedValue(
                        project,
                    );

                const request = {
                    id: 'request-2',
                    params: {
                        name: 'old',
                    },
                    body,
                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.updateProject
                >[0];

                const reply =
                    mockReply();

                await controller.updateProject(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .updateProject,
                ).toHaveBeenCalledWith(
                    'old',
                    body,
                );

                expect(
                    triggerVercelDeployMock,
                ).toHaveBeenCalledTimes(
                    1,
                );

                expect(
                    processProjectAIMock,
                ).not.toHaveBeenCalled();

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    success: true,
                    data: project,
                });
            },
        );

        it(
            'updateProject regenerateAI returns 202',
            async () => {
                const project = {
                    id: 'p4',
                };

                projectServiceMock
                    .updateProject
                    .mockResolvedValue(
                        project,
                    );

                const request = {
                    id: 'request-3',
                    params: {
                        name: 'proj',
                    },
                    body: {
                        titolo:
                            'Updated',
                        regenerateAI:
                            true,
                    },
                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.updateProject
                >[0];

                const reply =
                    mockReply();

                await controller.updateProject(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .updateProject,
                ).toHaveBeenCalledWith(
                    'proj',
                    {
                        titolo:
                            'Updated',
                    },
                );

                expect(
                    processProjectAIMock,
                ).toHaveBeenCalledWith(
                    project.id,
                    true,
                    true,
                );

                expect(
                    triggerVercelDeployMock,
                ).not.toHaveBeenCalled();

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    202,
                );
            },
        );

        it(
            'deleteProject removes and deploys',
            async () => {
                projectServiceMock
                    .deleteProject
                    .mockResolvedValue(
                        undefined,
                    );

                const request = {
                    id: 'request-4',
                    params: {
                        name: 'rem',
                    },
                    user: {
                        username:
                            'admin',
                    },
                } as unknown as Parameters<
                    typeof controller.deleteProject
                >[0];

                const reply =
                    mockReply();

                await controller.deleteProject(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .deleteProject,
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
                            'DELETE_PROJECT',
                        resource:
                            'Project',
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

        it(
            'generateAIForProject triggers AI',
            async () => {
                const project = {
                    id: 'p5',
                };

                projectServiceMock
                    .getProjectById
                    .mockResolvedValue(
                        project,
                    );

                const request = {
                    params: {
                        name: 'p5',
                    },
                } as unknown as Parameters<
                    typeof controller.generateAIForProject
                >[0];

                const reply =
                    mockReply();

                await controller.generateAIForProject(
                    request,
                    reply,
                );

                expect(
                    projectServiceMock
                        .getProjectById,
                ).toHaveBeenCalledWith(
                    'p5',
                );

                expect(
                    processProjectAIMock,
                ).toHaveBeenCalledWith(
                    project.id,
                    true,
                    true,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    202,
                );
            },
        );
    },
);