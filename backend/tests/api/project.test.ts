import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';
import bcrypt from 'bcrypt';
import { Admin } from '../../src/models/Admin';

describe('Project API', () => {
    let token = '';

    /**
     * Prepare the Fastify application and authenticate a dedicated test administrator.
     *
     * The setup intentionally mirrors the real authentication flow instead of
     * manually generating a JWT. This ensures that the integration test validates
     * the complete login and cookie-based authentication mechanism.
     */
    beforeAll(async () => {
        // Ensure all Fastify plugins, hooks and routes are registered before
        // the application is exercised by the integration tests.
        await app.ready();

        // Remove any previous test administrator with the same username.
        //
        // This prevents duplicate-key errors when the test suite is executed
        // repeatedly against the same test database.
        await Admin.deleteMany({
            username: 'testadmin',
        });

        // Create a bcrypt hash using the same password hashing strategy
        // used by the production authentication flow.
        const passwordHash = await bcrypt.hash(
            'testpassword',
            10,
        );

        // Seed a dedicated administrator account used exclusively
        // by the integration test suite.
        await Admin.create({
            username: 'testadmin',
            passwordHash,
        });

        // Authenticate through the public login endpoint instead of
        // bypassing the application layer.
        //
        // This allows the test to verify the real authentication flow,
        // including password validation and session-cookie generation.
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
                username: 'testadmin',
                password: 'testpassword',
            },
        });

        // The administrator must be authenticated successfully before
        // any protected API endpoint is tested.
        expect(loginResponse.statusCode).toBe(200);

        // Extract the authentication cookie issued by the login endpoint.
        // Subsequent protected requests use this cookie to simulate an
        // authenticated administrator session.
        const tokenCookie = loginResponse.cookies.find(
            cookie => cookie.name === 'token',
        );

        // Fail immediately if the authentication endpoint did not return
        // the expected token cookie. Without this assertion, the protected
        // endpoint tests could fail later with a misleading 401 response.
        if (!tokenCookie?.value) {
            throw new Error(
                `Test administrator authentication failed. ` +
                `Login returned ${ loginResponse.statusCode }: ${ loginResponse.payload } `,
            );
        }

        // Store the authentication token so it can be sent with
        // protected project API requests.
        token = tokenCookie.value;
    });

    /**
     * Close the Fastify application after all integration tests have completed.
     *
     * The shared MongoDB connection is managed by tests/setup.ts,
     * so this hook only closes the Fastify application instance.
     */
    afterAll(async () => {
        await app.close();
    });

    /**
     * Verify that an authenticated administrator can create a project.
     */
    it('should create a project with admin token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/projects',
            cookies: {
                token,
            },
            payload: {
                titolo: 'API Test Project',
                descrizione: 'This is an API test description',
                tecnologie: ['Fastify', 'Vitest'],
            },
        });

        // The API should return HTTP 201 when the project is created successfully.
        expect(response.statusCode).toBe(201);

        const body = JSON.parse(response.payload);

        // Verify the standard success response structure.
        expect(body.success).toBe(true);

        // Verify that the returned project contains the expected title.
        expect(body.data.titolo).toBe('API Test Project');
    });

    /**
     * Verify that project creation is rejected when no authentication
     * token is provided.
     */
    it('should reject project creation without token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/projects',
            payload: {
                titolo: 'API Test Project 2',
                descrizione: 'This is an API test description',
                tecnologie: ['Fastify', 'Vitest'],
            },
        });

        // The protected endpoint must reject unauthenticated requests.
        expect(response.statusCode).toBe(401);
    });

    /**
     * Verify that the projects endpoint is publicly accessible and
     * returns a paginated collection.
     */
    it('should fetch paginated projects publically', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/projects?page=1&limit=10',
        });

        // Public project listing should return HTTP 200.
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);

        // Verify the standard success response structure.
        expect(body.success).toBe(true);

        // Verify that the API returns the projects collection as an array.
        expect(Array.isArray(body.data)).toBe(true);
    });
});

