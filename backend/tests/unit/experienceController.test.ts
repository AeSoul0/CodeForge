// backend/tests/unit/experienceController.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as controller from '../../src/controllers/experienceController';

// Mock ExperienceService and utilities
vi.mock('../../src/services/ExperienceService', () => {
  return {
    ExperienceService: class {
      getAllExperiences = vi.fn();
      createExperience = vi.fn();
      updateExperience = vi.fn();
      deleteExperience = vi.fn();
    },
  };
});
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

describe('experienceController', () => {
  let serviceInstance: any;
  beforeEach(() => {
    vi.clearAllMocks();
    const { ExperienceService } = require('../../src/services/ExperienceService.ts');
    serviceInstance = new ExperienceService();
  });

  it('getExperiences returns paginated list with cache header', async () => {
    const fake = [{ id: 'e1' }];
    serviceInstance.getAllExperiences.mockResolvedValue(fake);
    const req = { query: {} } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.getExperiences(req, reply);
    expect(serviceInstance.getAllExperiences).toHaveBeenCalledWith(1, 10);
    expect(reply.header).toHaveBeenCalledWith('Cache-Control', expect.any(String));
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: fake });
  });

  it('createExperience creates and triggers deploy', async () => {
    const newExp = { id: 'e2' };
    serviceInstance.createExperience.mockResolvedValue(newExp);
    const req = { body: { titolo: 'Exp' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.createExperience(req, reply);
    expect(serviceInstance.createExperience).toHaveBeenCalledWith(req.body);
    const { triggerVercelDeploy } = require('../../src/utils/vercel');
    expect(triggerVercelDeploy).toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: newExp });
  });

  it('updateExperience updates and triggers deploy', async () => {
    const updated = { id: 'e3' };
    serviceInstance.updateExperience.mockResolvedValue(updated);
    const req = {
      params: { name: 'old' },
      body: { titolo: 'New' },
    } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.updateExperience(req, reply);
    expect(serviceInstance.updateExperience).toHaveBeenCalledWith('old', req.body);
    const { triggerVercelDeploy } = require('../../src/utils/vercel');
    expect(triggerVercelDeploy).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('updateExperienceImage updates image and returns data', async () => {
    const updated = { id: 'e4' };
    serviceInstance.updateExperience.mockResolvedValue(updated);
    const req = {
      params: { name: 'old' },
      body: { image: 'img.png' },
    } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.updateExperienceImage(req, reply);
    expect(serviceInstance.updateExperience).toHaveBeenCalledWith('old', { image: 'img.png' });
    expect(reply.send).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('deleteExperience removes and triggers deploy', async () => {
    serviceInstance.deleteExperience.mockResolvedValue(undefined);
    const req = { params: { name: 'rem' } } as unknown as FastifyRequest;
    const reply = mockReply();
    await controller.deleteExperience(req, reply);
    expect(serviceInstance.deleteExperience).toHaveBeenCalledWith('rem');
    const { triggerVercelDeploy } = require('../../src/utils/vercel');
    expect(triggerVercelDeploy).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Experience successfully deleted.' });
  });
});
