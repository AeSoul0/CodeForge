import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import { RevokedToken } from '../../src/models/RevokedToken';
import { hashToken } from '../../src/services/TokenRevocationService';

describe('JWT revocation at logout', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects the same token after logout, until it expires', async () => {
        const token = app.jwt.sign({ jti: 'revocation-test', id: 'test', username: 'admin', role: 'admin' });
        const headers = { 'x-requested-with': 'CodeForge' };

        const before = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token } });
        expect(before.statusCode).toBe(200);

        const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', cookies: { token }, headers });
        expect(logout.statusCode).toBe(200);

        // The copied cookie no longer works, on /me and on protected routes.
        const me = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token } });
        expect(me.statusCode).toBe(401);

        const del = await app.inject({ method: 'DELETE', url: '/api/projects/test', cookies: { token }, headers });
        expect(del.statusCode).toBe(401);

        // Stored as a hash, removed by the TTL index when the JWT expires (24 h).
        const entry = await RevokedToken.findOne({ tokenHash: hashToken(token) }).lean();
        expect(entry).not.toBeNull();
        const exp = (app.jwt.decode(token) as { exp: number }).exp;
        expect(entry?.expiresAt.getTime()).toBe(exp * 1000);
        expect(exp * 1000 - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);

        // Logging out again with the same token is harmless.
        const again = await app.inject({ method: 'POST', url: '/api/auth/logout', cookies: { token }, headers });
        expect(again.statusCode).toBe(200);
    });

    it('does not affect other sessions', async () => {
        const other = app.jwt.sign({ jti: 'other-session', id: 'test', username: 'admin', role: 'admin' });

        const me = await app.inject({ method: 'GET', url: '/api/auth/me', cookies: { token: other } });
        expect(me.statusCode).toBe(200);
    });

    it('logs out without a token', async () => {
        const response = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { 'x-requested-with': 'CodeForge' } });
        expect(response.statusCode).toBe(200);
    });
});
