/**
 * @file src/lib/admin/experiences.ts
 * @description Admin experience management: table, create/edit dialog,
 * logo upload and deletion.
 */

import {
    apiRequest,
    getApiUrl,
} from '../api';

import {
    byId,
    h,
} from '../dom';

import {
    formatExperienceDuration,
    formatPeriod,
    parseList,
    resolveImageUrl,
} from '../format';

import {
    closeDialog,
    confirmAction,
    openDialog,
    renderMessageRow,
    setFormError,
    showToast,
    withBusy,
} from './ui';

import {
    projectId as experienceId,
} from './projects';

export interface AdminExperience {
    id?: string;
    _id?: string;
    role: string;
    company: string;
    description: string;
    technologies?: string[];
    startDate: string;
    endDate?: string | null;
    current?: boolean;
    image?: string | null;
}

export interface ExperienceFormValues {
    role: string;
    company: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    current: boolean;
}

export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
];

/** Base64 inflates by 4/3; the backend accepts 10 MB of base64. */
export const MAX_IMAGE_BYTES = 7 * 1024 * 1024;

const TABLE_COLUMNS = 4;

/**
 * ISO date -> value for <input type="month"> ("YYYY-MM").
 */
export function toMonthInput(
    value: string | null | undefined,
): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function experienceToForm(
    experience: AdminExperience | null,
): ExperienceFormValues {
    return {
        role: experience?.role ?? '',
        company: experience?.company ?? '',
        description: experience?.description ?? '',
        technologies: (experience?.technologies ?? []).join(', '),
        startDate: toMonthInput(experience?.startDate),
        endDate: toMonthInput(experience?.endDate),
        current: Boolean(experience?.current),
    };
}

/**
 * Validate against the backend schema. Returns an error message or null.
 */
export function validateExperienceForm(
    values: ExperienceFormValues,
): string | null {
    const role = values.role.trim();
    const company = values.company.trim();
    const description = values.description.trim();

    if (role.length < 2 || role.length > 100) {
        return 'Role must be between 2 and 100 characters.';
    }

    if (company.length < 2 || company.length > 100) {
        return 'Company must be between 2 and 100 characters.';
    }

    if (description.length < 10 || description.length > 5000) {
        return 'Description must be between 10 and 5000 characters.';
    }

    if (!/^\d{4}-\d{2}$/.test(values.startDate)) {
        return 'Start date is required.';
    }

    if (!values.current && values.endDate) {
        if (!/^\d{4}-\d{2}$/.test(values.endDate)) {
            return 'End date is invalid.';
        }

        if (values.endDate < values.startDate) {
            return 'End date cannot be before the start date.';
        }
    }

    if (parseList(values.technologies).length > 30) {
        return 'Use at most 30 technologies.';
    }

    return null;
}

export function formToPayload(
    values: ExperienceFormValues,
): Record<string, unknown> {
    return {
        role: values.role.trim(),
        company: values.company.trim(),
        description: values.description.trim(),
        technologies: parseList(values.technologies),
        startDate: values.startDate,
        endDate: values.current || !values.endDate
            ? null
            : values.endDate,
        current: values.current,
    };
}

/**
 * Validate an image file selected for upload.
 */
export function validateImageFile(
    file: File,
): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Logo must be a JPEG, PNG or WebP image.';
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return 'Logo must be smaller than 7 MB.';
    }

    return null;
}

/**
 * Read a file as a Base64 data URI.
 */
export function readFileAsDataUrl(
    file: File,
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener('load', () => resolve(String(reader.result)));
        reader.addEventListener('error', () => reject(reader.error ?? new Error('Unable to read file')));

        reader.readAsDataURL(file);
    });
}

export interface ExperienceRowHandlers {
    onEdit: (experience: AdminExperience) => void;
    onDelete: (experience: AdminExperience) => void;
}

export function renderExperienceRows(
    tbody: HTMLTableSectionElement,
    experiences: AdminExperience[],
    handlers: ExperienceRowHandlers,
    apiUrl: string = getApiUrl(),
): void {
    if (!experiences.length) {
        renderMessageRow(tbody, TABLE_COLUMNS, 'No experiences yet. Create the first one.');
        return;
    }

    tbody.replaceChildren(
        ...experiences.map((experience) => {
            const id = experienceId(experience);
            const label = `${experience.role} at ${experience.company}`;

            const edit = h(
                'button',
                {
                    type: 'button',
                    class: 'admin-action text-blue-300 hover:text-blue-200',
                    'data-action': 'edit',
                    'aria-label': `Edit ${label}`,
                },
                'Edit',
            );

            const remove = h(
                'button',
                {
                    type: 'button',
                    class: 'admin-action text-red-300 hover:text-red-200',
                    'data-action': 'delete',
                    'aria-label': `Delete ${label}`,
                },
                'Delete',
            );

            edit.addEventListener('click', () => handlers.onEdit(experience));
            remove.addEventListener('click', () => handlers.onDelete(experience));

            const logo = resolveImageUrl(experience.image, apiUrl);

            return h(
                'tr',
                {
                    class: 'border-b border-white/5 hover:bg-white/5 transition-colors',
                    'data-experience-id': id,
                },
                h(
                    'td',
                    { class: 'pl-6 pr-2 py-4 w-20' },
                    logo
                        ? h('img', {
                            src: logo,
                            alt: '',
                            class: 'block w-12 h-12 max-w-none rounded-lg object-contain bg-white p-1 ring-1 ring-white/10',
                            loading: 'lazy',
                        })
                        : h('div', { class: 'w-12 h-12 rounded-lg bg-white/5', 'aria-hidden': 'true' }),
                ),
                h(
                    'td',
                    { class: 'px-6 py-4' },
                    h('div', { class: 'font-medium text-white' }, experience.role),
                    h('div', { class: 'text-xs text-slate-400' }, experience.company),
                ),
                h(
                    'td',
                    { class: 'px-6 py-4 whitespace-nowrap' },
                    h('div', {}, formatPeriod(experience.startDate, experience.endDate, experience.current)),
                    h(
                        'div',
                        { class: 'text-xs text-slate-400' },
                        formatExperienceDuration(experience.startDate, experience.endDate, experience.current) ?? '',
                    ),
                ),
                h(
                    'td',
                    { class: 'px-6 py-4 text-right whitespace-nowrap space-x-3' },
                    h(
                        'a',
                        {
                            href: '/#experience',
                            target: '_blank',
                            rel: 'noopener',
                            class: 'admin-action text-emerald-300 hover:text-emerald-200',
                            'aria-label': `Preview ${label}`,
                        },
                        'Preview',
                    ),
                    edit,
                    remove,
                ),
            );
        }),
    );
}

export function readExperienceForm(
    doc: Document = document,
): ExperienceFormValues {
    return {
        role: byId<HTMLInputElement>('e-role', doc).value,
        company: byId<HTMLInputElement>('e-company', doc).value,
        description: byId<HTMLTextAreaElement>('e-description', doc).value,
        technologies: byId<HTMLInputElement>('e-technologies', doc).value,
        startDate: byId<HTMLInputElement>('e-startDate', doc).value,
        endDate: byId<HTMLInputElement>('e-endDate', doc).value,
        current: byId<HTMLInputElement>('e-current', doc).checked,
    };
}

export function writeExperienceForm(
    values: ExperienceFormValues,
    doc: Document = document,
): void {
    byId<HTMLInputElement>('e-role', doc).value = values.role;
    byId<HTMLInputElement>('e-company', doc).value = values.company;
    byId<HTMLTextAreaElement>('e-description', doc).value = values.description;
    byId<HTMLInputElement>('e-technologies', doc).value = values.technologies;
    byId<HTMLInputElement>('e-startDate', doc).value = values.startDate;
    byId<HTMLInputElement>('e-endDate', doc).value = values.endDate;
    byId<HTMLInputElement>('e-current', doc).checked = values.current;
    syncEndDateState(doc);
}

/**
 * Disable the end date while "I currently work here" is checked.
 */
export function syncEndDateState(
    doc: Document = document,
): void {
    const current = byId<HTMLInputElement>('e-current', doc).checked;
    const endDate = byId<HTMLInputElement>('e-endDate', doc);

    endDate.disabled = current;

    if (current) {
        endDate.value = '';
    }
}

/**
 * Upload or remove the logo of an experience. Returns an error or null.
 */
export async function uploadExperienceImage(
    id: string,
    file: File | null,
    remove: boolean,
): Promise<string | null> {
    if (!file && !remove) {
        return null;
    }

    let image: string | null = null;

    if (file) {
        const fileError = validateImageFile(file);

        if (fileError) {
            return fileError;
        }

        image = await readFileAsDataUrl(file);
    }

    const result = await apiRequest(
        `/api/experiences/${encodeURIComponent(id)}/image`,
        {
            method: 'PATCH',
            body: { image },
        },
    );

    return result.ok
        ? null
        : `Logo upload failed: ${result.message}`;
}

/**
 * Show a logo in the dialog preview, or the "No logo" placeholder.
 */
export function setLogoPreview(
    src: string | null,
    doc: Document = document,
): void {
    const preview = byId<HTMLImageElement>('e-imagePreview', doc);

    if (src) {
        preview.src = src;
    } else {
        preview.removeAttribute('src');
    }

    preview.classList.toggle('hidden', !src);
    byId('e-imagePlaceholder', doc).classList.toggle('hidden', Boolean(src));
}

export function initExperiencesPage(
    doc: Document = document,
): { reload: () => Promise<void> } {
    const tbody = byId<HTMLTableSectionElement>('expTableBody', doc);
    const dialog = byId<HTMLDialogElement>('expDialog', doc);
    const form = byId<HTMLFormElement>('expForm', doc);
    const title = byId('expDialogTitle', doc);
    const errorBox = byId('expFormError', doc);
    const saveButton = byId<HTMLButtonElement>('expSaveBtn', doc);
    const imageInput = byId<HTMLInputElement>('e-image', doc);
    const removeImage = byId<HTMLInputElement>('e-removeImage', doc);
    const count = byId('expCount', doc);

    let editing: AdminExperience | null = null;

    // Fade the current logo while "Remove current logo" is ticked.
    const syncRemoveState = () => {
        byId('e-imagePreview', doc).classList.toggle('opacity-30', removeImage.checked);
    };

    const reload = async () => {
        const result = await apiRequest<AdminExperience[]>('/api/experiences?limit=100');

        if (!result.ok || !Array.isArray(result.data)) {
            count.textContent = '';
            renderMessageRow(tbody, TABLE_COLUMNS, `Failed to load experiences: ${result.message}`, 'error');
            return;
        }

        count.textContent = `${result.data.length} experience${result.data.length === 1 ? '' : 's'}`;
        renderExperienceRows(tbody, result.data, handlers);
    };

    const openEditor = (experience: AdminExperience | null) => {
        editing = experience;
        form.reset();
        writeExperienceForm(experienceToForm(experience), doc);
        setFormError(errorBox, null);
        removeImage.closest('[data-remove-image]')?.classList.toggle('hidden', !experience?.image);
        setLogoPreview(resolveImageUrl(experience?.image, getApiUrl()), doc);
        syncRemoveState();
        title.textContent = experience ? 'Edit Experience' : 'New Experience';
        openDialog(dialog);
        byId<HTMLInputElement>('e-role', doc).focus();
    };

    const handlers: ExperienceRowHandlers = {
        onEdit: openEditor,

        onDelete: async (experience) => {
            const confirmed = await confirmAction(
                `Delete "${experience.role} at ${experience.company}"? This cannot be undone.`,
                'Delete',
                doc,
            );

            if (!confirmed) {
                return;
            }

            const result = await apiRequest(
                `/api/experiences/${encodeURIComponent(experienceId(experience))}`,
                { method: 'DELETE' },
            );

            if (result.ok) {
                showToast('Experience deleted.', 'success', doc);
                await reload();
            } else {
                showToast(`Delete failed: ${result.message}`, 'error', doc);
            }
        },
    };

    byId('e-current', doc).addEventListener('change', () => syncEndDateState(doc));

    // Preview a newly selected logo before it is uploaded.
    imageInput.addEventListener('change', async () => {
        const file = imageInput.files?.[0];
        const fileError = file ? validateImageFile(file) : null;

        setFormError(errorBox, fileError);

        if (file && !fileError) {
            setLogoPreview(await readFileAsDataUrl(file), doc);
            removeImage.checked = false;
            syncRemoveState();
        }
    });

    removeImage.addEventListener('change', syncRemoveState);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const values = readExperienceForm(doc);
        const validationError = validateExperienceForm(values);
        const file = imageInput.files?.[0] ?? null;
        const fileError = file ? validateImageFile(file) : null;

        if (validationError || fileError) {
            setFormError(errorBox, validationError ?? fileError);
            return;
        }

        const isUpdate = Boolean(editing);

        await withBusy(saveButton, 'Saving…', async () => {
            const result = await apiRequest<AdminExperience>(
                isUpdate
                    ? `/api/experiences/${encodeURIComponent(experienceId(editing!))}`
                    : '/api/experiences',
                {
                    method: isUpdate ? 'PATCH' : 'POST',
                    body: formToPayload(values),
                },
            );

            if (!result.ok) {
                setFormError(errorBox, result.message);
                return;
            }

            const savedId = result.data ? experienceId(result.data) : experienceId(editing ?? { id: '' });

            const imageError = savedId
                ? await uploadExperienceImage(savedId, file, removeImage.checked)
                : null;

            closeDialog(dialog);
            showToast(
                imageError ?? (isUpdate ? 'Experience updated.' : 'Experience created.'),
                imageError ? 'error' : 'success',
                doc,
            );
            await reload();
        });
    });

    byId('newExpBtn', doc).addEventListener('click', () => openEditor(null));

    dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => closeDialog(dialog));
    });

    return {
        reload,
    };
}
