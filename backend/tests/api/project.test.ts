import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import { Project } from '../../src/models/Projects';
import bcrypt from 'bcrypt';
import { Admin } from '../../src/models/Admin';

describe('Project API', () => {
    let token = '';
    
    beforeAll(async () => {
        // Wait for plugins to load
        await app.ready();

        // Create an admin to get a token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const admin = await Admin.create({ username: 'testadmin', passwordHash });
        
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { username: 'testadmin', password: 'testpassword' }
        });
        
        // Extract token cookie
        const cookies = loginResponse.cookies;
        const tokenCookie = cookies.find(c => c.name === 'token');
        if (tokenCookie) {
            token = tokenCookie.value;
        }
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create a project with admin token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/projects',
            cookies: { token },
            payload: {
                titolo: 'API Test Project',
                descrizione: 'This is an API test description',
                tecnologie: ['Fastify', 'Vitest']
            }
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.data.titolo).toBe('API Test Project');
    });

    it('should reject project creation without token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/projects',
            payload: {
                titolo: 'API Test Project 2',
                descrizione: 'This is an API test description',
                tecnologie: ['Fastify', 'Vitest']
            }
        });

        expect(response.statusCode).toBe(401);
    });

    it('should fetch paginated projects publically', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/projects?page=1&limit=10'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });
});
