import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/index';

describe('Experience API', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should fetch paginated experiences publically', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/experiences?page=1&limit=10',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });
});
