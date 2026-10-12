// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it } from 'vitest';

import DashboardPage from '../../src/pages/admin/dashboard/index.astro';
import {
    countAiPending,
    fetchOverview,
    initOverview,
    recentProjects,
    renderOverview,
} from '../../src/lib/admin/overview';
import type { AdminProject } from '../../src/lib/admin/projects';
import { mockFetch, mountAstro } from '../helpers';

const base = { descrizione: 'd', tecnologie: [] };

const projects: AdminProject[] = [
    { ...base, titolo: 'Old', updatedAt: '2025-01-01T00:00:00Z', descrizioneLunga: '# done' },
    { ...base, titolo: 'New', updatedAt: '2026-01-01T00:00:00Z' },
    { ...base, titolo: 'Pending', createdAt: '2025-06-01T00:00:00Z', descrizioneLunga: 'AI analysis is currently processing...' },
    { ...base, titolo: 'Undated', descrizioneLunga: 'x' },
];

describe('overview helpers', () => {
    it('counts projects awaiting AI documentation', () => {
        expect(countAiPending(projects)).toBe(2);
    });

    it('orders projects by most recent activity', () => {
        expect(recentProjects(projects, 3).map((project) => project.titolo)).toEqual(['New', 'Pending', 'Old']);
    });
});

describe('dashboard overview', () => {
    beforeEach(async () => {
        await mountAstro(DashboardPage);
    });

    const text = (id: string) => document.getElementById(id)!.textContent;

    it('fetches and renders stats with the recent list', async () => {
        mockFetch({
            'GET /api/projects': { body: { data: projects } },
            'GET /api/experiences': { body: { data: [{}, {}] } },
            'GET /live': { body: { status: 'ok' } },
        });

        await initOverview();

        expect(text('stat-projects')).toBe('4');
        expect(text('stat-experiences')).toBe('2');
        expect(text('stat-ai')).toBe('2');
        expect(text('stat-backend')).toBe('Online');
        expect(document.querySelectorAll('#recentProjects li')).toHaveLength(4);
        expect(text('recentProjects')).toContain('New');
    });

    it('handles an offline backend', async () => {
        mockFetch({});

        const stats = await fetchOverview();
        expect(stats).toEqual({ projects: null, experienceCount: null, backendOnline: false, aiPending: 0 });

        renderOverview(stats);
        expect(text('stat-projects')).toBe('—');
        expect(text('stat-experiences')).toBe('—');
        expect(text('stat-backend')).toBe('Offline');
        expect(text('recentProjects')).toBe('Projects could not be loaded.');
    });

    it('handles an empty portfolio', () => {
        renderOverview({ projects: [], experienceCount: 0, backendOnline: true, aiPending: 0 });

        expect(text('recentProjects')).toBe('No projects yet.');
        expect(text('stat-ai')).toBe('0');
    });
});
