/**
 * @file src/lib/admin/overview.ts
 * @description Dashboard overview: content counts, backend health and the
 * most recently updated projects.
 */

import {
    apiRequest,
} from '../api';

import {
    byId,
    h,
} from '../dom';

import {
    formatRelativeTime,
} from '../format';

import type {
    AdminProject,
} from './projects';

export interface OverviewStats {
    projects: AdminProject[] | null;
    experienceCount: number | null;
    backendOnline: boolean;
    aiPending: number;
}

const AI_PENDING_MARKER = 'AI analysis is currently processing';

/**
 * Projects whose AI documentation is missing or still being generated.
 */
export function countAiPending(
    projects: AdminProject[],
): number {
    return projects.filter((project) =>
        !project.descrizioneLunga?.trim() ||
        project.descrizioneLunga.includes(AI_PENDING_MARKER),
    ).length;
}

/**
 * Most recently updated first.
 */
export function recentProjects(
    projects: AdminProject[],
    limit = 5,
): AdminProject[] {
    const timestamp = (project: AdminProject) =>
        new Date(project.updatedAt ?? project.createdAt ?? 0).getTime() || 0;

    return [...projects]
        .sort((a, b) => timestamp(b) - timestamp(a))
        .slice(0, limit);
}

export async function fetchOverview(): Promise<OverviewStats> {
    const [projects, experiences, live] = await Promise.all([
        apiRequest<AdminProject[]>('/api/projects?limit=100'),
        apiRequest<unknown[]>('/api/experiences?limit=100'),
        apiRequest('/live'),
    ]);

    const projectList = projects.ok && Array.isArray(projects.data) ? projects.data : null;

    return {
        projects: projectList,
        experienceCount: experiences.ok && Array.isArray(experiences.data) ? experiences.data.length : null,
        backendOnline: live.ok,
        aiPending: projectList ? countAiPending(projectList) : 0,
    };
}

export function renderOverview(
    stats: OverviewStats,
    doc: Document = document,
    now: Date = new Date(),
): void {
    byId('stat-projects', doc).textContent =
        stats.projects ? String(stats.projects.length) : '—';

    byId('stat-experiences', doc).textContent =
        stats.experienceCount === null ? '—' : String(stats.experienceCount);

    byId('stat-ai', doc).textContent =
        stats.projects ? String(stats.aiPending) : '—';

    const backend = byId('stat-backend', doc);
    backend.textContent = stats.backendOnline ? 'Online' : 'Offline';
    backend.classList.toggle('text-emerald-300', stats.backendOnline);
    backend.classList.toggle('text-red-300', !stats.backendOnline);

    const list = byId('recentProjects', doc);

    if (!stats.projects) {
        list.replaceChildren(h('li', { class: 'text-sm text-red-300' }, 'Projects could not be loaded.'));
        return;
    }

    const recent = recentProjects(stats.projects);

    if (!recent.length) {
        list.replaceChildren(h('li', { class: 'text-sm text-slate-400' }, 'No projects yet.'));
        return;
    }

    list.replaceChildren(
        ...recent.map((project) =>
            h(
                'li',
                { class: 'flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0' },
                h('span', { class: 'text-sm text-white truncate' }, project.titolo),
                h('span', { class: 'text-xs text-slate-400 whitespace-nowrap' }, formatRelativeTime(project.updatedAt ?? project.createdAt, now)),
            ),
        ),
    );
}

export async function initOverview(
    doc: Document = document,
): Promise<void> {
    renderOverview(await fetchOverview(), doc);
}
