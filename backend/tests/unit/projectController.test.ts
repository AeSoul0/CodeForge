// backend/tests/unit/projectController.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as controller from '../../src/controllers/projectController';

// Mock ProjectService and auxiliary utils
vi.mock('../../src/services/ProjectService', () => {
  return {
    ProjectService: class {
      getAllProjects = vi.fn();
      createProject = vi.fn();
      updateProject = vi.fn();
      deleteProject = vi.fn();
      getProjectById = vi.fn();
    },
  };
});
vi.mock('../../src/utils/ai', () => ({ processProjectAI: vi.fn() }));
vi.mock('../../src/utils/vercel', () => ({ triggerVercelDeploy: vi.fn() }));
vi.mock('../../src/utils/auditLogger', () => ({ auditLogger: { log: vi.fn() } }));

const mockReply = () => {
  const reply: Partial<FastifyReply> = {
    header: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  };
  return reply as FastifyReply;
};

describe('projectController', () => {
  let serviceInstance: any;
  beforeEach(() => {
    vi.clearAllMocks();
    // Retrieve the mocked instance
    const { ProjectService } = require('../../src/services/ProjectService.ts');
    serviceInstance = new ProjectService();
  });

  it('getProjects returns paginated list', async () => {
    const fakeProjects = [{ id: 'p1' }];
    serviceInstance.getAllProjects.mockResolvedValue(fakeProjects);
    const req = { query: {} } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.getProjects(req, reply);
    expect(serviceInstance.getAllProjects).toHaveBeenCalledWith(1, 10);
    expect(reply.header).toHaveBeenCalledWith('Cache-Control', expect.any(String));
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: fakeProjects });
  });

  it('createProject creates and triggers AI', async () => {
    const newProj = { id: 'p2' };
    serviceInstance.createProject.mockResolvedValue(newProj);
    const req = { body: { titolo: 'Test' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.createProject(req, reply);
    expect(serviceInstance.createProject).toHaveBeenCalledWith(req.body);
    const { processProjectAI } = require('../../src/utils/ai');
    expect(processProjectAI).toHaveBeenCalledWith(newProj.id, false, true);
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: newProj });
  });

  it('updateProject normal flow triggers deploy', async () => {
    const updated = { id: 'p3' };
    serviceInstance.updateProject.mockResolvedValue(updated);
    const req = {
      params: { name: 'old' },
      body: { titolo: 'New' },
    } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.updateProject(req, reply);
    expect(serviceInstance.updateProject).toHaveBeenCalledWith('old', req.body);
    const { triggerVercelDeploy } = require('../../src/utils/vercel');
    expect(triggerVercelDeploy).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('updateProject with regenerateAI returns 202 and triggers AI', async () => {
    const updated = { id: 'p4' };
    serviceInstance.updateProject.mockResolvedValue(updated);
    const req = {
      params: { name: 'proj' },
      body: { regenerateAI: true },
    } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.updateProject(req, reply);
    const { processProjectAI } = require('../../src/utils/ai');
    expect(processProjectAI).toHaveBeenCalledWith(updated.id, true, true);
    expect(reply.status).toHaveBeenCalledWith(202);
    expect(reply.send).toHaveBeenCalled();
  });

  it('deleteProject removes project and triggers deploy', async () => {
    serviceInstance.deleteProject.mockResolvedValue(undefined);
    const req = { params: { name: 'rem' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.deleteProject(req, reply);
    expect(serviceInstance.deleteProject).toHaveBeenCalledWith('rem');
    const { triggerVercelDeploy } = require('../../src/utils/vercel');
    expect(triggerVercelDeploy).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Project successfully deleted.' });
  });

  it('generateAIForProject returns 404 when missing', async () => {
    serviceInstance.getProjectById.mockResolvedValue(null);
    const req = { params: { name: 'none' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.generateAIForProject(req, reply);
    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalled();
  });

  it('generateAIForProject triggers AI when project exists', async () => {
    const proj = { id: 'p5' };
    serviceInstance.getProjectById.mockResolvedValue(proj);
    const req = { params: { name: 'p5' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.generateAIForProject(req, reply);
    const { processProjectAI } = require('../../src/utils/ai');
    expect(processProjectAI).toHaveBeenCalledWith(proj.id, true, true);
    expect(reply.status).toHaveBeenCalledWith(202);
    expect(reply.send).toHaveBeenCalled();
  });
});
