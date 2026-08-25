// backend/tests/unit/projectService.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProjectService } from '../../src/services/ProjectService';
import { NotFoundError, AppError } from '../../src/errors/AppError';

// Mock ProjectRepository
vi.mock('../../src/repositories/ProjectRepository', () => {
  return {
    ProjectRepository: class {
      findAll = vi.fn();
      findById = vi.fn();
      create = vi.fn();
      update = vi.fn();
      delete = vi.fn();
    },
  };
});

describe('ProjectService', () => {
  let service: ProjectService;
  let repo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const { ProjectRepository } = require('../../src/repositories/ProjectRepository.ts');
    repo = new ProjectRepository();
    service = new ProjectService();
    // replace internal repository with our mock instance
    (service as any).repository = repo;
  });

  it('getAllProjects returns mapped DTOs', async () => {
    const fake = [{ _id: 'id1', titolo: 't', role: 'r', descrizione: 'd', descrizioneLunga: 'dl', tecnologie: [], categoria: 'c', categorie: [], linkGithub: '', image: '', createdAt: new Date(), updatedAt: new Date() }];
    repo.findAll.mockResolvedValue(fake);
    const result = await service.getAllProjects(1, 10);
    expect(repo.findAll).toHaveBeenCalledWith(1, 10);
    expect(result[0].id).toBe('id1');
    expect(result[0].titolo).toBe('t');
  });

  it('getProjectById returns DTO when found', async () => {
    const proj = { _id: 'p1', titolo: 'x', role: 'y', descrizione: 'z', descrizioneLunga: '', tecnologie: [], categoria: '', categorie: [], linkGithub: '', image: '', createdAt: new Date(), updatedAt: new Date() };
    repo.findById.mockResolvedValue(proj);
    const res = await service.getProjectById('p1');
    expect(repo.findById).toHaveBeenCalledWith('p1');
    expect(res.id).toBe('p1');
  });

  it('getProjectById throws NotFoundError when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getProjectById('missing')).rejects.toThrow(NotFoundError);
  });

  it('createProject returns DTO on success', async () => {
    const created = { _id: 'new', titolo: 'n', role: '', descrizione: '', descrizioneLunga: '', tecnologie: [], categoria: '', categorie: [], linkGithub: '', image: '', createdAt: new Date(), updatedAt: new Date() };
    repo.create.mockResolvedValue(created);
    const dto = await service.createProject({ titolo: 'n' } as any);
    expect(repo.create).toHaveBeenCalled();
    expect(dto.id).toBe('new');
  });

  it('createProject throws AppError on failure', async () => {
    repo.create.mockResolvedValue(null);
    await expect(service.createProject({} as any)).rejects.toThrow(AppError);
  });

  it('updateProject returns DTO when updated', async () => {
    const updated = { _id: 'u', titolo: 'u' } as any;
    repo.update.mockResolvedValue(updated);
    const res = await service.updateProject('u', { titolo: 'u' } as any);
    expect(repo.update).toHaveBeenCalledWith('u', expect.any(Object));
    expect(res.id).toBe('u');
  });

  it('updateProject throws NotFoundError when not found', async () => {
    repo.update.mockResolvedValue(null);
    await expect(service.updateProject('missing', {} as any)).rejects.toThrow(NotFoundError);
  });

  it('deleteProject succeeds when repo returns truthy', async () => {
    repo.delete.mockResolvedValue(true);
    await expect(service.deleteProject('del')).resolves.not.toThrow();
    expect(repo.delete).toHaveBeenCalledWith('del');
  });

  it('deleteProject throws NotFoundError when repo returns falsy', async () => {
    repo.delete.mockResolvedValue(false);
    await expect(service.deleteProject('missing')).rejects.toThrow(NotFoundError);
  });
});