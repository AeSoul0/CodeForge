/**
 * @file frontend/src/pages/sitemap.xml.ts
 * @description XML sitemap generated from the live project list.
 *
 * Project pages are rendered on demand from MongoDB, so a static sitemap
 * would miss every project added from the admin dashboard. If the backend
 * is unavailable the sitemap still lists the static pages.
 */

import type { APIContext } from 'astro';

import { getApiUrl } from '../lib/api';
import { fetchProjects } from '../lib/content';
import { slugify } from '../lib/format';

const STATIC_PATHS = [
    '/',
    '/projects/codeforge',
];

export async function GET(
    { site }: Pick<APIContext, 'site'>,
): Promise<Response> {
    let projectPaths: string[] = [];

    try {
        const projects =
            await fetchProjects<{ titolo: string }>(getApiUrl());

        projectPaths = projects.map(
            (project) => `/projects/${slugify(project.titolo)}`,
        );
    } catch (error) {
        console.error('[Sitemap] Failed to fetch projects', error);
    }

    const origin = site ?? new URL('https://aesoul0.com');

    const urls = [...new Set([...STATIC_PATHS, ...projectPaths])]
        .map((path) => `  <url><loc>${new URL(path, origin).href}</loc></url>`)
        .join('\n');

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
            },
        },
    );
}
