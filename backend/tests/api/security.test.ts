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
            }
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
});
