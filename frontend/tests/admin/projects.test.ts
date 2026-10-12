// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectsPage from '../../src/pages/admin/dashboard/projects.astro';
import {
    filterProjects,
    formToPayload,
    initProjectsPage,
    projectId,
    projectToForm,
    renderExperienceOptions,
    renderProjectRows,
    validateProjectForm,
    type AdminProject,
    type ProjectFormValues,
} from '../../src/lib/admin/projects';
import { flush, jsonBody, mockFetch, mountAstro } from '../helpers';

const project: AdminProject = {
    id: 'p1',
    titolo: 'Città <script>alert(1)</script>',
    role: 'Lead',
    descrizione: 'A sufficiently long description.',
    descrizioneLunga: '## Docs',
    tecnologie: ['Astro', 'TS'],
    categorie: ['ai'],
    linkGithub: 'https://github.com/x/y',
    image: '',
    experienceId: 'e1',
    updatedAt: '2026-01-01T00:00:00Z',
};

const validForm: ProjectFormValues = {
    titolo: 'Project',
    role: '',
    descrizione: 'Long enough text',
    descrizioneLunga: '',
    categorie: 'ai, data',
    tecnologie: 'Astro',
    linkGithub: '',
    image: '',
    experienceId: '',
};

describe('pure helpers', () => {
    it('projectId supports id and _id', () => {
        expect(projectId({ id: 'a' })).toBe('a');
        expect(projectId({ _id: 'b' })).toBe('b');
        expect(projectId({})).toBe('');
    });

    it('maps projects to form values (legacy category included)', () => {
        expect(projectToForm(null).titolo).toBe('');
        expect(projectToForm({ ...project, categorie: [], categoria: 'data', tecnologie: undefined, linkGithub: null, experienceId: null })).toMatchObject({
            categorie: 'data',
            tecnologie: '',
            linkGithub: '',
            experienceId: '',
        });
        expect(projectToForm(project).tecnologie).toBe('Astro, TS');
    });

    it.each([
        [{ titolo: 'ab' }, 'Title'],
        [{ role: 'ab' }, 'Role'],
        [{ descrizione: 'short' }, 'Description'],
        [{ tecnologie: ' , ' }, 'at least one technology'],
        [{ tecnologie: Array.from({ length: 31 }, (_, i) => `t${i}`).join(',') }, 'at most 30'],
        [{ categorie: Array.from({ length: 11 }, (_, i) => `c${i}`).join(',') }, 'at most 10'],
        [{ linkGithub: 'ftp://x' }, 'GitHub URL'],
    ])('validation rejects %j', (override, message) => {
        expect(validateProjectForm({ ...validForm, ...override })).toContain(message);
    });

    it('accepts a valid form', () => {
        expect(validateProjectForm({ ...validForm, role: 'Lead dev', linkGithub: 'https://github.com' })).toBeNull();
    });

    it('builds create payloads without empty optional fields', () => {
        expect(formToPayload(validForm, false)).toEqual({
            titolo: 'Project',
            descrizione: 'Long enough text',
            tecnologie: ['Astro'],
            categorie: ['ai', 'data'],
            categoria: 'ai',
        });
    });

    it('builds update payloads that can clear nullable fields', () => {
        expect(formToPayload({ ...validForm, categorie: '', role: 'Lead', image: '/img.png' }, true)).toEqual({
            titolo: 'Project',
            descrizione: 'Long enough text',
            tecnologie: ['Astro'],
            categorie: [],
            role: 'Lead',
            descrizioneLunga: '',
            linkGithub: null,
            image: '/img.png',
            experienceId: null,
        });
    });

    it('filters by title, role, category and technology', () => {
        const list = [project, { ...project, id: 'p2', titolo: 'Other', role: undefined, tecnologie: undefined, categorie: ['iot'] }];

        expect(filterProjects(list, '')).toHaveLength(2);
        expect(filterProjects(list, 'astro')).toHaveLength(1);
        expect(filterProjects(list, 'IOT')).toHaveLength(1);
        expect(filterProjects(list, 'lead')).toHaveLength(1);
        expect(filterProjects(list, 'zzz')).toHaveLength(0);
    });
});

describe('renderProjectRows', () => {
    it('renders data as text and wires row actions', () => {
        const tbody = document.createElement('tbody');
        const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onGenerateAI: vi.fn() };

        renderProjectRows(tbody, [project, { titolo: 'Bare', descrizione: 'x', _id: 'p3' }], handlers, 'empty', new Date('2026-01-02T00:00:00Z'));

        const row = tbody.querySelector('tr')!;
        expect(row.querySelector('script')).toBeNull();
        expect(row.textContent).toContain('<script>alert(1)</script>');
        expect(row.textContent).toContain('yesterday');
        expect(row.querySelector('a')!.getAttribute('href')).toBe('/projects/citta-script-alert-1-script');

        row.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
        row.querySelector<HTMLButtonElement>('[data-action="ai"]')!.click();
        row.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();

        expect(handlers.onEdit).toHaveBeenCalledWith(project);
        expect(handlers.onGenerateAI).toHaveBeenCalledWith(project);
        expect(handlers.onDelete).toHaveBeenCalledWith(project);

        expect(tbody.querySelectorAll('tr')[1].textContent).toContain('—');
    });

    it('renders the empty message', () => {
        const tbody = document.createElement('tbody');

        renderProjectRows(tbody, [], { onEdit: vi.fn(), onDelete: vi.fn(), onGenerateAI: vi.fn() });

        expect(tbody.textContent).toBe('No projects found.');
        expect(tbody.querySelector('td')!.getAttribute('colspan')).toBe('5');
    });

    it('renders experience options', () => {
        const select = document.createElement('select');

        renderExperienceOptions(select, [{ id: 'e1', role: 'Dev', company: 'ACME' }]);

        expect([...select.options].map((option) => [option.value, option.text])).toEqual([
            ['', 'No linked experience'],
            ['e1', 'Dev — ACME'],
        ]);
    });
});

describe('initProjectsPage', () => {
    let store: AdminProject[];

    beforeEach(async () => {
        await mountAstro(ProjectsPage);

        store = [project];

        mockFetch({
            'GET /api/projects': () => ({ body: { success: true, data: store } }),
            'GET /api/experiences': { body: { data: [{ id: 'e1', role: 'Dev', company: 'ACME' }] } },
            'POST /api/projects': (init) => {
                const created = { id: 'new', ...(jsonBody(init) as AdminProject) };
                store = [created, ...store];
                return { status: 201, body: { success: true, data: created } };
            },
            'PATCH /api/projects/p1': (init) => {
                store = store.map((item) => (item.id === 'p1' ? { ...item, ...(jsonBody(init) as AdminProject) } : item));
                return { body: { success: true } };
            },
            'DELETE /api/projects/p1': () => {
                store = store.filter((item) => item.id !== 'p1');
                return { body: { success: true } };
            },
            'POST /api/projects/p1/generate-ai': { status: 202, body: { success: true } },
        });
    });

    function page() {
        const controls = initProjectsPage();
        return controls;
    }

    it('loads projects, experiences and supports search', async () => {
        await page().reload();
        await flush();

        expect(document.getElementById('projectCount')!.textContent).toBe('1 project');
        expect(document.querySelectorAll('#p-experienceId option')).toHaveLength(2);

        const search = document.getElementById('projectSearch') as HTMLInputElement;
        search.value = 'nothing';
        search.dispatchEvent(new Event('input'));

        expect(document.getElementById('projectCount')!.textContent).toBe('0 of 1 projects');
        expect(document.getElementById('projectsTableBody')!.textContent).toBe('No projects match your search.');
    });

    it('creates a project through the dialog', async () => {
        await page().reload();

        document.getElementById('newProjectBtn')!.click();
        expect((document.getElementById('projectDialog') as HTMLDialogElement).open).toBe(true);
        expect(document.getElementById('projectDialogTitle')!.textContent).toBe('New Project');

        (document.getElementById('p-titolo') as HTMLInputElement).value = 'Fresh project';
        (document.getElementById('p-descrizione') as HTMLTextAreaElement).value = 'Brand new description';
        (document.getElementById('p-tecnologie') as HTMLInputElement).value = 'Go';

        document.getElementById('projectForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();

        expect(store[0].titolo).toBe('Fresh project');
        expect(document.getElementById('projectCount')!.textContent).toBe('2 projects');
        expect(document.getElementById('toastRegion')!.textContent).toContain('Project created.');
    });

    it('shows validation and server errors inside the dialog', async () => {
        await page().reload();
        document.getElementById('newProjectBtn')!.click();

        document.getElementById('projectForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();

        const error = document.getElementById('projectFormError')!;
        expect(error.classList.contains('hidden')).toBe(false);
        expect(error.textContent).toContain('Title');

        mockFetch({ 'POST /api/projects': { status: 400, body: { error: { message: 'Duplicate key error.' } } } });

        (document.getElementById('p-titolo') as HTMLInputElement).value = 'Fresh project';
        (document.getElementById('p-descrizione') as HTMLTextAreaElement).value = 'Brand new description';
        (document.getElementById('p-tecnologie') as HTMLInputElement).value = 'Go';
        document.getElementById('projectForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();

        expect(error.textContent).toBe('Duplicate key error.');
        expect((document.getElementById('projectSaveBtn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('edits, regenerates AI docs and deletes', async () => {
        await page().reload();

        document.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
        expect(document.getElementById('projectDialogTitle')!.textContent).toBe('Edit Project');
        expect((document.getElementById('p-tecnologie') as HTMLInputElement).value).toBe('Astro, TS');

        (document.getElementById('p-role') as HTMLInputElement).value = 'Architect';
        document.getElementById('projectForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();
        expect(store[0].role).toBe('Architect');

        expect(document.getElementById('toastRegion')!.textContent).toContain('Project updated.');

        document.querySelector<HTMLButtonElement>('[data-action="ai"]')!.click();
        await flush();
        expect(document.getElementById('toastRegion')!.textContent).toContain('AI documentation regeneration started');

        const confirmDialog = document.getElementById('confirmDialog') as HTMLDialogElement;

        // Cancelling keeps the project.
        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        expect(confirmDialog.open).toBe(true);
        confirmDialog.querySelector<HTMLButtonElement>('[data-confirm-cancel]')!.click();
        await flush();
        expect(store).toHaveLength(1);

        // Confirming deletes it.
        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        confirmDialog.querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
        await flush();
        expect(store).toHaveLength(0);
        expect(document.getElementById('toastRegion')!.textContent).toContain('Deleted');
    });

    it('reports failed AI generation and deletion', async () => {
        store = [{ ...project }];
        await page().reload();

        mockFetch({
            'POST /api/projects/p1/generate-ai': { status: 429, body: { message: 'Rate limit exceeded.' } },
            'DELETE /api/projects/p1': { status: 500, body: { message: 'boom' } },
        });

        document.querySelector<HTMLButtonElement>('[data-action="ai"]')!.click();
        await flush();
        expect(document.getElementById('toastRegion')!.textContent).toContain('AI generation failed: Rate limit exceeded.');

        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        document.querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
        await flush();
        expect(document.getElementById('toastRegion')!.textContent).toContain('Delete failed: boom');
    });

    it('closes the dialog with the cancel buttons', async () => {
        await page().reload();
        const dialog = document.getElementById('projectDialog') as HTMLDialogElement;

        document.getElementById('newProjectBtn')!.click();
        dialog.querySelector<HTMLButtonElement>('[data-dialog-close]')!.click();

        expect(dialog.open).toBe(false);
    });

    it('renders a load error', async () => {
        mockFetch({ 'GET /api/projects': { status: 500, body: { message: 'boom' } } });

        await page().reload();

        expect(document.getElementById('projectsTableBody')!.textContent).toBe('Failed to load projects: boom');
    });
});
