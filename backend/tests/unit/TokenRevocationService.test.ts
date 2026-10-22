import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest } from 'fastify';

import {
    getRequestToken,
    hashToken,
    tokenRevocationService,
} from '../../src/services/TokenRevocationService';
import { revokedTokenRepository } from '../../src/repositories/RevokedTokenRepository';

vi.mock('../../src/repositories/RevokedTokenRepository', () => ({
    revokedTokenRepository: {
        add: vi.fn(),
        exists: vi.fn(),
    },
}));

const request = (value: Partial<FastifyRequest>) => value as FastifyRequest;

describe('TokenRevocationService', () => {
    beforeEach(() => {
        vi.mocked(revokedTokenRepository.add).mockReset();
        vi.mocked(revokedTokenRepository.exists).mockReset();
    });

    it('reads the token from the Authorization header, then the cookie', () => {
        expect(getRequestToken(request({ headers: { authorization: 'Bearer abc' }, cookies: { token: 'c' } }))).toBe('abc');
        expect(getRequestToken(request({ headers: {}, cookies: { token: 'c' } }))).toBe('c');
        expect(getRequestToken(request({ headers: { authorization: 'Basic x' }, cookies: {} }))).toBeUndefined();
        expect(getRequestToken(request({}))).toBeUndefined();
    });

    it('stores only a SHA-256 hash, until the token expires', async () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;

        await tokenRevocationService.revoke('raw.jwt.token', exp);

        expect(hashToken('raw.jwt.token')).toMatch(/^[0-9a-f]{64}$/);
        expect(revokedTokenRepository.add).toHaveBeenCalledWith(hashToken('raw.jwt.token'), new Date(exp * 1000));
    });

    it('skips tokens that have already expired', async () => {
        await tokenRevocationService.revoke('old', Math.floor(Date.now() / 1000) - 1);

        expect(revokedTokenRepository.add).not.toHaveBeenCalled();
    });

    it('checks the request token against the denylist', async () => {
        vi.mocked(revokedTokenRepository.exists).mockResolvedValue(true);

        expect(await tokenRevocationService.isRequestRevoked(request({ cookies: { token: 't' } }))).toBe(true);
        expect(revokedTokenRepository.exists).toHaveBeenCalledWith(hashToken('t'));

        // No token: nothing to look up.
        expect(await tokenRevocationService.isRequestRevoked(request({}))).toBe(false);
        expect(revokedTokenRepository.exists).toHaveBeenCalledTimes(1);
    });
});
