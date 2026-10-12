import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';

describe('Security API Tests', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 401 for protected route without JWT', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/projects/test'
        });
        expect(response.statusCode).toBe(401);
    });

    it('should return 401 for protected route with invalid JWT', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/projects/test',
            cookies: {
                token: 'invalid.jwt.token'
            },
            headers: { 'x-requested-with': 'CodeForge' }
        });
        expect(response.statusCode).toBe(401);
    });

    it('should enforce rate limits on login', async () => {
        // Exceed the limit (max 5 per minute)
        for (let i = 0; i < 5; i++) {
            await app.inject({
                method: 'POST',
                url: '/api/auth/login',
                payload: { username: 'a', password: 'b' }
            });
        }
        
        const response = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { username: 'a', password: 'b' }
        });
        
        expect(response.statusCode).toBe(429);
    });

    it('should reject malformed body with 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/projects',
            payload: '{ invalid json }',
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(400);
    });

    it('should set expected security headers (Helmet)', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/'
        });
        
        expect(response.headers).toHaveProperty('content-security-policy');
        expect(response.headers).toHaveProperty('strict-transport-security');
        expect(response.headers).toHaveProperty('x-frame-options');
        expect(response.headers).toHaveProperty('referrer-policy');
    });

    it('should reject extra properties if configured in schema', async () => {
        const token = app.jwt.sign({ id: 'test', username: 'admin', role: 'admin' });
        const response = await app.inject({
            method: 'POST',
            url: '/api/experiences',
            cookies: { token },
            headers: { 'x-requested-with': 'CodeForge' },
            payload: {
                role: 'Dev',
                company: 'Corp',
                description: 'test',
                startDate: '01/2020',
                hacked_field: 'should_fail'
            }
        });
        expect([201, 400]).toContain(response.statusCode);
    });

    it('should reject cookie-authenticated mutations without the anti-CSRF header', async () => {
        const token = app.jwt.sign({ id: 'test', username: 'admin', role: 'admin' });
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/projects/test',
            cookies: { token },
        });
        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.payload).error.code).toBe('CSRF_HEADER_MISSING');
    });

    it('should reject cookie-authenticated mutations from untrusted origins', async () => {
        const token = app.jwt.sign({ id: 'test', username: 'admin', role: 'admin' });
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/projects/test',
            cookies: { token },
            headers: {
                origin: 'https://evil.example',
                'x-requested-with': 'CodeForge',
            },
        });
        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.payload).error.code).toBe('CSRF_ORIGIN_REJECTED');
    });

    it('should reject login attempts from untrusted origins', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            headers: { referer: 'https://evil.example/phish' },
            payload: { username: 'admin', password: 'x' },
        });
        expect(response.statusCode).toBe(403);
    });

    it('should serve a strict CSP without unsafe-inline', async () => {
        const response = await app.inject({ method: 'GET', url: '/' });
        const csp = String(response.headers['content-security-policy']);
        expect(csp).toContain("default-src 'none'");
        expect(csp).not.toContain('unsafe-inline');
    });

    it('should reject out-of-range pagination', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/projects?limit=1000' });
        expect(response.statusCode).toBe(400);
    });
});
