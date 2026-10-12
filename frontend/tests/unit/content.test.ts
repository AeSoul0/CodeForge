import { describe, expect, it, vi } from 'vitest';

import { COLLECTION_LIMIT, fetchProjects, loadPortfolioContent } from '../../src/lib/content';
import { mockFetch } from '../helpers';

describe('fetchProjects', () => {
    it('requests the full collection and unwraps both payload shapes', async () => {
        const fetchMock = mockFetch({
            [`GET /api/projects?limit=${COLLECTION_LIMIT}`]: { body: { data: [{ titolo: 'A' }] } },
        });

        expect(await fetchProjects('http://api')).toEqual([{ titolo: 'A' }]);
        expect(fetchMock.mock.calls[0][0]).toBe(`http://api/api/projects?limit=${COLLECTION_LIMIT}`);

        mockFetch({ 'GET /api/projects': { body: [{ titolo: 'B' }] } });
        expect(await fetchProjects('http://api', fetch, { cache: 'no-store' })).toEqual([{ titolo: 'B' }]);
    });

    it('rejects on HTTP errors and unexpected payloads', async () => {
        mockFetch({ 'GET /api/projects': { status: 503, body: {} } });
        await expect(fetchProjects('http://api')).rejects.toThrow('status 503');

        mockFetch({ 'GET /api/projects': { body: { nope: true } } });
        await expect(fetchProjects('http://api')).rejects.toThrow('Unexpected payload');
    });
});

describe('loadPortfolioContent', () => {
    it('loads projects and experiences in parallel', async () => {
        mockFetch({
            'GET /api/projects': { body: { data: [{ titolo: 'P' }] } },
            'GET /api/experiences': { body: [{ role: 'R' }] },
        });

        expect(await loadPortfolioContent('http://api')).toEqual({
            projects: [{ titolo: 'P' }],
            experiences: [{ role: 'R' }],
            apiError: false,
        });
    });

    it('reports failures through apiError instead of throwing', async () => {
        mockFetch({ 'GET /api/projects': { body: { data: [] } } });
        const logger = { error: vi.fn() };

        expect(await loadPortfolioContent('http://api', fetch, logger)).toEqual({
            projects: [],
            experiences: [],
            apiError: true,
        });
        expect(logger.error).toHaveBeenCalled();
    });
});
