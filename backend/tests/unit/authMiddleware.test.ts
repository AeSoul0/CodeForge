// tests/unit/authMiddleware.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateAdmin } from '../../src/middlewares/auth';
import { tokenRevocationService } from '../../src/services/TokenRevocationService';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('authenticateAdmin middleware', () => {
  const originalEnv = { ...process.env };
  let request: Partial<FastifyRequest>;
  let reply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    request = {
      log: { warn: vi.fn() },
      jwtVerify: vi.fn(),
    } as any;
    reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('bypasses auth in development when DEV_BYPASS_AUTH=true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';
    await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(request.log?.warn).toHaveBeenCalledWith('[AUTH] DEV_BYPASS_AUTH is enabled. JWT verification is skipped.');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('fails with 401 when JWT verification throws', async () => {
    (request.jwtVerify as any).mockRejectedValue(new Error('invalid'));
    await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Invalid or missing token' });
  });

  it('fails with 403 when JWT decoded role is not admin', async () => {
    (request.jwtVerify as any).mockResolvedValue({ role: 'user' });
    await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ success: false, error: 'Forbidden: Admin access required' });
  });

  it('fails with 401 when the token was revoked at logout', async () => {
    const spy = vi.spyOn(tokenRevocationService, 'isRequestRevoked').mockResolvedValue(true);
    (request.jwtVerify as any).mockResolvedValue({ role: 'admin' });
    await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Invalid or missing token' });
    spy.mockRestore();
  });

  it('fails closed with 401 when the revocation check errors', async () => {
    const spy = vi.spyOn(tokenRevocationService, 'isRequestRevoked').mockRejectedValue(new Error('db down'));
    (request.jwtVerify as any).mockResolvedValue({ role: 'admin' });
    await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(401);
    spy.mockRestore();
  });

  it('passes through when JWT is valid admin', async () => {
    (request.jwtVerify as any).mockResolvedValue({ role: 'admin' });
    const result = await authenticateAdmin(request as FastifyRequest, reply as FastifyReply);
    expect(result).toBeUndefined(); // no reply sent
  });
});
