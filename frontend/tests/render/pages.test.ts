import { describe, expect, it, vi } from 'vitest';

import Experience from '../../src/components/Experience.astro';
import ProjectsGrid from '../../src/components/ProjectsGrid.astro';
import ParticleCanvas from '../../src/components/ParticleCanvas.astro';
import Layout from '../../src/layouts/Layout.astro';
import { GET as health } from '../../src/pages/api/health';
import HomePage from '../../src/pages/index.astro';
import { GET as sitemap } from '../../src/pages/sitemap.xml';
import ProjectPage from '../../src/pages/projects/[slug].astro';
import CodeForgePage from '../../src/pages/projects/codeforge.astro';
import { mockFetch, renderAstro } from '../helpers';

const projects = [
    {
        id: '1',
        titolo: 'Città Digitale',
        role: 'Lead',
        descrizione: 'Smart city platform.',
        descrizioneLunga: '# Overview\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))',
        tecnologie: ['Astro', 'Node'],
        categorie: ['Full Stack', 'AI'],
        linkGithub: 'https://github.com/x/citta',
        image: '/api/projects/1/image',
    },
    {
        id: '2',
        titolo: 'Embedded Sensor',
        descrizione: 'Firmware for sensors.',
        tecnologie: [],
        categoria: 'embedded',
        experienceImage: 'https://cdn.example/logo.png',
        descrizioneLunga: 'AI analysis is currently processing',
    },
    { id: '3', titolo: 'Plain Tool', descrizione: 'A tool.', tecnologie: ['Go'] },
    { id: '4', titolo: 'CodeForge', descrizione: 'This site.', tecnologie: ['Astro'], categorie: ['full-stack'] },
];

const experiences = [
    {
        id: 'e1',
        role: 'Engineer',
        company: 'ACME',
        description: 'Built the platform.\n\nCut latency by half.\n\nMentored two juniors.',
        technologies: ['TS'],
        startDate: '2023-09-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        current: false,
        image: '/api/experiences/e1/image',
    },
    {
        id: 'e2',
        role: 'Student',
        company: 'Uni',
        description: 'Studied.',
        technologies: [],
        startDate: '2020-09-01T00:00:00.000Z',
        current: true,
    },
];

describe('homepage', () => {
    it('renders projects and experiences from the API', async () => {
        mockFetch({
            'GET /api/projects': { body: { data: projects } },
            'GET /api/experiences': { body: { data: experiences } },
        });

        const html = await renderAstro(HomePage);

        expect(html).toContain('Città Digitale');
        expect(html).toContain('href="/projects/citta-digitale"');
        expect(html).toContain('data-filter="full-stack"');
        expect(html).toContain('Embedded Systems Engineer');
        expect(html).toContain('Sep 2023 - Feb 2024');
        expect(html).toContain('Sep 2020 - Present');
        expect(html).toContain('What changed (Outcome)');
        expect(html).toContain('Mentored two juniors.');
        expect(html).not.toContain('Backend Connection Failed');
        // CodeForge is featured separately, not in the grid.
        expect(html).not.toContain('href="/projects/codeforge" class="text-xs');
        // Only one particle canvas per page.
        expect(html.match(/id="particleCanvas"/g)).toHaveLength(1);
        // Navigation and footer sit beside <main>, not inside it, and case
        // study links carry the project name for screen readers.
        const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
        expect(html.match(/<main\b/g)).toHaveLength(1);
        expect(html).toContain('<nav');
        expect(main).not.toContain('<nav');
        expect(main).not.toContain('<footer');
        expect(html).toMatch(/View Case Study<span class="sr-only"[^>]*>: Città Digitale<\/span>/);
        // The header logo links home and has an accessible name.
        expect(html).toMatch(/<a href="\/" aria-label="ÆSoul, home"[^>]*>\s*<img src="\/AeSoul_logo-mark\.webp" alt=""/);
    });

    it('renders the API error state when the backend is down', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mockFetch({ 'GET /api/projects': { status: 503 } });

        const html = await renderAstro(HomePage);

        expect(html).toContain('Backend Connection Failed');
    });
});

describe('ProjectsGrid', () => {
    it('renders the empty state', async () => {
        const html = await renderAstro(ProjectsGrid, { props: { projects: [] } });

        expect(html).toContain('No Projects Found');
    });

    it('derives roles and proof points', async () => {
        const html = await renderAstro(ProjectsGrid, {
            props: {
                projects: [
                    { titolo: 'Full', descrizione: 'x', tecnologie: [], categorie: ['full-stack'] },
                    { titolo: 'Embedded Board', descrizione: 'x', tecnologie: [] },
                ],
            },
        });

        expect(html).toContain('Full-stack Engineer');
        expect(html).toContain('Software Engineer');
        expect(html).toContain('Hardware optimized');
    });
});

describe('Experience', () => {
    it('renders the error and empty states', async () => {
        expect(await renderAstro(Experience, { props: { experiences: [], apiError: true } })).toMatch(/unavailable|failed|error/i);
        expect(await renderAstro(Experience, { props: { experiences: [] } })).toContain('id="experience"');
    });
});

describe('project detail page', () => {
    const render = (slug: string) => renderAstro(ProjectPage, { params: { slug } });

    it('renders sanitised Markdown documentation and metadata', async () => {
        mockFetch({ 'GET /api/projects': { body: { data: projects } } });

        const html = await render('citta-digitale');

        expect(html).toContain('<h1>Overview</h1>');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).not.toContain('javascript:');
        expect(html).toContain('https://github.com/x/citta');
        expect(html).toContain('/api/projects/1/image');
        // Layout.astro owns the single <main> landmark.
        expect(html.match(/<main\b/g)).toHaveLength(1);
    });

    it('shows the pending state while AI docs are generated', async () => {
        mockFetch({ 'GET /api/projects': { body: [projects[1]] } });

        const html = await render('embedded-sensor');

        expect(html).toContain('Embedded Sensor');
        expect(html).toContain('https://cdn.example/logo.png');
    });

    it('renders projects without image or categories', async () => {
        mockFetch({ 'GET /api/projects': { body: { data: projects } } });

        expect(await render('plain-tool')).toContain('Plain Tool');
    });

    it('returns 404 for unknown projects and 503 when the API fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        mockFetch({ 'GET /api/projects': { body: { data: projects } } });
        expect(await render('missing')).toMatch(/not found/i);

        mockFetch({ 'GET /api/projects': { status: 500 } });
        expect(await render('citta-digitale')).toMatch(/unavailable|try again/i);
    });
});

describe('static pages and layout', () => {
    it('renders the CodeForge case study', async () => {
        const html = await renderAstro(CodeForgePage);
        expect(html.match(/<main\b/g)).toHaveLength(1);

        expect(html).toContain('CodeForge');
    });

    it('renders the layout with SEO metadata and a single loader', async () => {
        const html = await renderAstro(Layout, { props: { title: 'T', description: 'D' }, slots: { default: '<p>x</p>' } });

        expect(html).toContain('<title>T</title>');
        expect(html).toContain('content="D"');
        expect(html).toContain('id="initial-loader"');
        expect(html).toContain('<html lang="en"');
    });

    it('omits the particle canvas in E2E mode', async () => {
        vi.stubEnv('PUBLIC_E2E', 'true');
        vi.resetModules();
        const { default: Canvas } = await import('../../src/components/ParticleCanvas.astro');

        expect(await renderAstro(Canvas)).not.toContain('particleCanvas');
        vi.unstubAllEnvs();

        expect(await renderAstro(ParticleCanvas)).toContain('particleCanvas');
    });
});

describe('/api/health', () => {
    it('reports the frontend as healthy', async () => {
        const response = await health();

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(await response.json()).toMatchObject({ status: 'ok' });
    });
});

describe('/sitemap.xml', () => {
    const site = new URL('https://aesoul0.com');

    it('lists the static pages and every project page', async () => {
        mockFetch({ 'GET /api/projects': { body: projects } });

        const response = await sitemap({ site });
        const xml = await response.text();

        expect(response.headers.get('Content-Type')).toContain('application/xml');
        expect(xml).toContain('<loc>https://aesoul0.com/</loc>');
        expect(xml).toContain('<loc>https://aesoul0.com/projects/codeforge</loc>');
        expect(xml).toContain('<loc>https://aesoul0.com/projects/citta-digitale</loc>');
        expect(xml).toContain('<loc>https://aesoul0.com/projects/embedded-sensor</loc>');
    });

    it('still lists the static pages when the backend is down', async () => {
        mockFetch({ 'GET /api/projects': { status: 503 } });
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const xml = await (await sitemap({ site: undefined })).text();

        expect(xml).toContain('<loc>https://aesoul0.com/</loc>');
        expect(xml).not.toContain('citta-digitale');
    });
});
