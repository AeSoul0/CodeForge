// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExperiencesPage from '../../src/pages/admin/dashboard/experiences.astro';
import {
    experienceToForm,
    formToPayload,
    initExperiencesPage,
    MAX_IMAGE_BYTES,
    readFileAsDataUrl,
    renderExperienceRows,
    toMonthInput,
    uploadExperienceImage,
    validateExperienceForm,
    validateImageFile,
    type AdminExperience,
    type ExperienceFormValues,
} from '../../src/lib/admin/experiences';
import { flush, jsonBody, mockFetch, mountAstro } from '../helpers';

const experience: AdminExperience = {
    id: 'e1',
    role: 'Engineer',
    company: 'ACME <b>',
    description: 'Built many things over time.',
    technologies: ['Node'],
    startDate: '2023-09-01T00:00:00.000Z',
    endDate: '2024-02-01T00:00:00.000Z',
    current: false,
    image: '/api/experiences/e1/image',
};

const validForm: ExperienceFormValues = {
    role: 'Dev',
    company: 'Co',
    description: 'Long enough description',
    technologies: 'TS',
    startDate: '2024-01',
    endDate: '',
    current: true,
};

function pngFile(size = 10, type = 'image/png') {
    return new File([new Uint8Array(size)], 'logo.png', { type });
}

function setFiles(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, 'files', { value: files, configurable: true });
}

describe('helpers', () => {
    it('converts ISO dates to month inputs', () => {
        expect(toMonthInput('2023-09-15T00:00:00Z')).toBe('2023-09');
        expect(toMonthInput('nope')).toBe('');
        expect(toMonthInput(null)).toBe('');
    });

    it('maps experiences to form values', () => {
        expect(experienceToForm(experience)).toEqual({
            role: 'Engineer',
            company: 'ACME <b>',
            description: 'Built many things over time.',
            technologies: 'Node',
            startDate: '2023-09',
            endDate: '2024-02',
            current: false,
        });
        expect(experienceToForm(null).current).toBe(false);
    });

    it.each([
        [{ role: 'D' }, 'Role'],
        [{ company: 'C' }, 'Company'],
        [{ description: 'short' }, 'Description'],
        [{ startDate: '' }, 'Start date'],
        [{ current: false, endDate: '2024' }, 'End date is invalid'],
        [{ current: false, endDate: '2023-01' }, 'before the start'],
        [{ technologies: Array.from({ length: 31 }, (_, i) => `t${i}`).join(',') }, 'at most 30'],
    ])('rejects %j', (override, message) => {
        expect(validateExperienceForm({ ...validForm, ...override })).toContain(message);
    });

    it('accepts valid forms', () => {
        expect(validateExperienceForm(validForm)).toBeNull();
        expect(validateExperienceForm({ ...validForm, current: false, endDate: '2024-06' })).toBeNull();
    });

    it('builds payloads that clear the end date for current roles', () => {
        expect(formToPayload({ ...validForm, endDate: '2025-01' })).toMatchObject({ endDate: null, current: true, technologies: ['TS'] });
        expect(formToPayload({ ...validForm, current: false, endDate: '2025-01' }).endDate).toBe('2025-01');
        expect(formToPayload({ ...validForm, current: false }).endDate).toBeNull();
    });

    it('validates image files', () => {
        expect(validateImageFile(pngFile())).toBeNull();
        expect(validateImageFile(pngFile(10, 'image/gif'))).toContain('JPEG, PNG or WebP');
        expect(validateImageFile(pngFile(MAX_IMAGE_BYTES + 1))).toContain('7 MB');
    });

    it('reads files as data URIs and propagates reader errors', async () => {
        expect(await readFileAsDataUrl(pngFile(3))).toMatch(/^data:image\/png;base64,/);

        const original = FileReader.prototype.readAsDataURL;
        FileReader.prototype.readAsDataURL = function (this: FileReader) {
            this.dispatchEvent(new Event('error'));
        };
        await expect(readFileAsDataUrl(pngFile())).rejects.toBeTruthy();
        FileReader.prototype.readAsDataURL = original;
    });
});

describe('uploadExperienceImage', () => {
    it('does nothing without a file or removal', async () => {
        const fetchMock = mockFetch({});
        expect(await uploadExperienceImage('e1', null, false)).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('uploads a data URI, removes with null and reports errors', async () => {
        const bodies: unknown[] = [];
        mockFetch({ 'PATCH /api/experiences/e1/image': (init) => { bodies.push(jsonBody(init)); return { body: { success: true } }; } });

        expect(await uploadExperienceImage('e1', pngFile(), false)).toBeNull();
        expect(await uploadExperienceImage('e1', null, true)).toBeNull();
        expect((bodies[0] as { image: string }).image).toMatch(/^data:image\/png/);
        expect(bodies[1]).toEqual({ image: null });

        expect(await uploadExperienceImage('e1', pngFile(1, 'text/plain'), false)).toContain('JPEG');

        mockFetch({ 'PATCH /api/experiences/e1/image': { status: 400, body: { message: 'Too large' } } });
        expect(await uploadExperienceImage('e1', pngFile(), false)).toBe('Logo upload failed: Too large');
    });
});

describe('renderExperienceRows', () => {
    it('renders rows with logos, placeholders and actions', () => {
        const tbody = document.createElement('tbody');
        const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };

        renderExperienceRows(tbody, [experience, { ...experience, _id: 'e2', id: undefined, image: null, current: true }], handlers, 'http://api');

        const rows = tbody.querySelectorAll('tr');
        expect(rows[0].querySelector('img')!.getAttribute('src')).toBe('http://api/api/experiences/e1/image');
        expect(rows[0].textContent).toContain('Sep 2023 - Feb 2024');
        expect(rows[0].textContent).toContain('0.5+ yrs');
        expect(rows[0].textContent).toContain('ACME <b>');
        expect(rows[1].querySelector('img')).toBeNull();
        expect(rows[1].getAttribute('data-experience-id')).toBe('e2');

        rows[0].querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
        rows[0].querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        expect(handlers.onEdit).toHaveBeenCalledWith(experience);
        expect(handlers.onDelete).toHaveBeenCalledWith(experience);

        renderExperienceRows(tbody, [], handlers);
        expect(tbody.textContent).toContain('No experiences yet');
    });
});

describe('initExperiencesPage', () => {
    let store: AdminExperience[];
    let imageBodies: unknown[];

    beforeEach(async () => {
        await mountAstro(ExperiencesPage);
        store = [experience];
        imageBodies = [];

        mockFetch({
            'GET /api/experiences': () => ({ body: { data: store } }),
            'POST /api/experiences': (init) => {
                const created = { id: 'new', ...(jsonBody(init) as AdminExperience) };
                store = [created, ...store];
                return { status: 201, body: { success: true, data: created } };
            },
            'PATCH /api/experiences/e1': (init) => {
                store = store.map((item) => (item.id === 'e1' ? { ...item, ...(jsonBody(init) as AdminExperience) } : item));
                return { body: { success: true } };
            },
            'PATCH /api/experiences/new/image': (init) => {
                imageBodies.push(jsonBody(init));
                return { status: 500, body: { message: 'disk full' } };
            },
            'PATCH /api/experiences/e1/image': (init) => {
                imageBodies.push(jsonBody(init));
                return { body: { success: true } };
            },
            'DELETE /api/experiences/e1': () => {
                store = [];
                return { body: { success: true } };
            },
        });
    });

    const field = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
    const submit = async () => {
        field('expForm').dispatchEvent(new Event('submit', { cancelable: true }));
        await flush(10);
    };

    it('lists experiences', async () => {
        await initExperiencesPage().reload();

        expect(field('expCount').textContent).toBe('1 experience');
        expect(field('expTableBody').textContent).toContain('Engineer');
    });

    it('creates an experience and reports a failed logo upload', async () => {
        await initExperiencesPage().reload();

        field('newExpBtn').click();
        expect(field('expDialogTitle').textContent).toBe('New Experience');

        field('e-role').value = 'Architect';
        field('e-company').value = 'Globex';
        field<HTMLTextAreaElement>('e-description').value = 'Designing systems at scale.';
        field('e-startDate').value = '2025-03';
        field('e-current').checked = true;
        field('e-current').dispatchEvent(new Event('change'));
        expect(field('e-endDate').disabled).toBe(true);

        setFiles(field('e-image'), [pngFile()]);

        await submit();

        expect(store[0]).toMatchObject({ role: 'Architect', current: true, endDate: null });
        expect(imageBodies).toHaveLength(1);
        expect(field('toastRegion').textContent).toContain('Logo upload failed: disk full');
        expect(field('expCount').textContent).toBe('2 experiences');
    });

    it('edits an experience and removes its logo', async () => {
        await initExperiencesPage().reload();

        document.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
        expect(field('expDialogTitle').textContent).toBe('Edit Experience');
        expect(field('e-startDate').value).toBe('2023-09');
        expect(document.querySelector('[data-remove-image]')!.classList.contains('hidden')).toBe(false);

        field('e-role').value = 'Senior Engineer';
        field('e-removeImage').checked = true;
        setFiles(field('e-image'), []);

        await submit();

        expect(store[0].role).toBe('Senior Engineer');
        expect(imageBodies).toEqual([{ image: null }]);
        expect(field('toastRegion').textContent).toContain('Experience updated.');
    });

    it('rejects invalid input and bad logo files before calling the API', async () => {
        await initExperiencesPage().reload();
        field('newExpBtn').click();

        await submit();
        expect(field('expFormError').textContent).toContain('Role');

        field('e-role').value = 'Architect';
        field('e-company').value = 'Globex';
        field<HTMLTextAreaElement>('e-description').value = 'Designing systems at scale.';
        field('e-startDate').value = '2025-03';
        setFiles(field('e-image'), [pngFile(5, 'image/gif')]);

        await submit();
        expect(field('expFormError').textContent).toContain('JPEG, PNG or WebP');
        expect(store).toHaveLength(1);
    });

    it('previews the current logo and a newly selected one', async () => {
        await initExperiencesPage().reload();
        const preview = field<HTMLImageElement>('e-imagePreview');
        const placeholder = field('e-imagePlaceholder');

        field('newExpBtn').click();
        expect(preview.classList.contains('hidden')).toBe(true);
        expect(preview.hasAttribute('src')).toBe(false);
        expect(placeholder.classList.contains('hidden')).toBe(false);
        field('expDialog').querySelector<HTMLButtonElement>('[data-dialog-close]')!.click();

        document.querySelector<HTMLButtonElement>('[data-action="edit"]')!.click();
        expect(preview.getAttribute('src')).toContain('/api/experiences/e1/image');
        expect(preview.classList.contains('hidden')).toBe(false);
        expect(placeholder.classList.contains('hidden')).toBe(true);

        field('e-removeImage').checked = true;
        field('e-removeImage').dispatchEvent(new Event('change'));
        expect(preview.classList.contains('opacity-30')).toBe(true);

        setFiles(field('e-image'), [pngFile(5, 'image/gif')]);
        field('e-image').dispatchEvent(new Event('change'));
        await flush();
        expect(field('expFormError').textContent).toContain('JPEG, PNG or WebP');
        expect(preview.getAttribute('src')).toContain('/api/experiences/e1/image');

        setFiles(field('e-image'), [pngFile()]);
        field('e-image').dispatchEvent(new Event('change'));
        await flush(10);
        expect(preview.getAttribute('src')).toMatch(/^data:image\/png/);
        expect(field('e-removeImage').checked).toBe(false);
        expect(preview.classList.contains('opacity-30')).toBe(false);

        setFiles(field('e-image'), []);
        field('e-image').dispatchEvent(new Event('change'));
        await flush();
        expect(preview.getAttribute('src')).toMatch(/^data:image\/png/);
    });

    it('shows API errors in the dialog', async () => {
        await initExperiencesPage().reload();
        mockFetch({ 'POST /api/experiences': { status: 400, body: { error: { message: 'Database validation failed.' } } } });

        field('newExpBtn').click();
        field('e-role').value = 'Architect';
        field('e-company').value = 'Globex';
        field<HTMLTextAreaElement>('e-description').value = 'Designing systems at scale.';
        field('e-startDate').value = '2025-03';

        await submit();
        expect(field('expFormError').textContent).toBe('Database validation failed.');
    });

    it('deletes after confirmation, reports failures, and closes the dialog', async () => {
        await initExperiencesPage().reload();

        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        field('confirmDialog').querySelector<HTMLButtonElement>('[data-confirm-cancel]')!.click();
        await flush();
        expect(store).toHaveLength(1);

        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        field('confirmDialog').querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
        await flush();
        expect(store).toHaveLength(0);
        expect(field('expTableBody').textContent).toContain('No experiences yet');

        store = [experience];
        await initExperiencesPage().reload();
        mockFetch({ 'DELETE /api/experiences/e1': { status: 500, body: { message: 'boom' } } });
        document.querySelector<HTMLButtonElement>('[data-action="delete"]')!.click();
        field('confirmDialog').querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
        await flush();
        expect(field('toastRegion').textContent).toContain('Delete failed: boom');

        field('newExpBtn').click();
        field('expDialog').querySelector<HTMLButtonElement>('[data-dialog-close]')!.click();
        expect((field('expDialog') as unknown as HTMLDialogElement).open).toBe(false);
    });

    it('renders a load error', async () => {
        mockFetch({ 'GET /api/experiences': { status: 0 as number, body: 'down' } });
        mockFetch({});

        await initExperiencesPage().reload();

        expect(field('expTableBody').textContent).toContain('Failed to load experiences');
    });
});
