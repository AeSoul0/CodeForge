/**
 * @file src/lib/admin/projects.ts
 * @description Admin project management: table, search, create/edit
 * dialog, AI regeneration and deletion.
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
    getCategoryLabel,
    getProjectCategories,
    parseList,
    slugify,
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

export interface AdminProject {
    id?: string;
    _id?: string;
    titolo: string;
    role?: string;
    descrizione: string;
    descrizioneLunga?: string;
    tecnologie?: string[];
    categoria?: string;
    categorie?: string[];
    linkGithub?: string | null;
    image?: string | null;
    experienceId?: string | null;
    updatedAt?: string;
    createdAt?: string;
}

export interface ExperienceOption {
    id?: string;
    _id?: string;
    role: string;
    company: string;
}

export interface ProjectFormValues {
    titolo: string;
    role: string;
    descrizione: string;
    descrizioneLunga: string;
    categorie: string;
    tecnologie: string;
    linkGithub: string;
    image: string;
    experienceId: string;
}

export type ProjectPayload = Record<string, unknown>;

const TABLE_COLUMNS = 5;

export function projectId(
    project: { id?: string; _id?: string },
): string {
    return project.id ?? project._id ?? '';
}

/**
 * Map a project to the dialog's field values.
 */
export function projectToForm(
    project: AdminProject | null,
): ProjectFormValues {
    return {
        titolo: project?.titolo ?? '',
        role: project?.role ?? '',
        descrizione: project?.descrizione ?? '',
        descrizioneLunga: project?.descrizioneLunga ?? '',
        categorie: project ? getProjectCategories(project).join(', ') : '',
        tecnologie: (project?.tecnologie ?? []).join(', '),
        linkGithub: project?.linkGithub ?? '',
        image: project?.image ?? '',
        experienceId: project?.experienceId ?? '',
    };
}

/**
 * Validate form values against the backend schema limits.
 * Returns an error message or null.
 */
export function validateProjectForm(
    values: ProjectFormValues,
): string | null {
    const title = values.titolo.trim();

    if (title.length < 3 || title.length > 100) {
        return 'Title must be between 3 and 100 characters.';
    }

    const role = values.role.trim();

    if (role && (role.length < 3 || role.length > 100)) {
        return 'Role must be between 3 and 100 characters.';
    }

    const description = values.descrizione.trim();

    if (description.length < 10 || description.length > 5000) {
        return 'Description must be between 10 and 5000 characters.';
    }

    if (parseList(values.tecnologie).length === 0) {
        return 'Add at least one technology.';
    }

    if (parseList(values.tecnologie).length > 30) {
        return 'Use at most 30 technologies.';
    }

    if (parseList(values.categorie).length > 10) {
        return 'Use at most 10 categories.';
    }

    const link = values.linkGithub.trim();

    if (link && !/^https?:\/\/.+/i.test(link)) {
        return 'GitHub URL must start with http:// or https://.';
    }

    return null;
}

/**
 * Build the API payload.
 *
 * Empty optional fields are omitted on create; on update the nullable ones
 * (link, image, experience) are sent as null so they can be cleared.
 */
export function formToPayload(
    values: ProjectFormValues,
    isUpdate: boolean,
): ProjectPayload {
    const categories = parseList(values.categorie);

    const payload: ProjectPayload = {
        titolo: values.titolo.trim(),
        descrizione: values.descrizione.trim(),
        tecnologie: parseList(values.tecnologie),
        categorie: categories,
    };

    if (categories[0]) {
        payload.categoria = categories[0];
    }

    const role = values.role.trim();

    if (role) {
        payload.role = role;
    }

    const longDescription = values.descrizioneLunga.trim();

    if (longDescription || isUpdate) {
        payload.descrizioneLunga = longDescription;
    }

    for (const key of ['linkGithub', 'image', 'experienceId'] as const) {
        const value = values[key].trim();

        if (value) {
            payload[key] = value;
        } else if (isUpdate) {
            payload[key] = null;
        }
    }

    return payload;
}

/**
 * Case-insensitive search over title, role, categories and technologies.
 */
export function filterProjects(
    projects: AdminProject[],
    query: string,
): AdminProject[] {
    const needle = query.trim().toLowerCase();

    if (!needle) {
        return projects;
    }

    return projects.filter((project) =>
        [
            project.titolo,
            project.role ?? '',
            ...getProjectCategories(project),
            ...(project.tecnologie ?? []),
        ].some((value) => value.toLowerCase().includes(needle)),
    );
}

export interface ProjectRowHandlers {
    onEdit: (project: AdminProject) => void;
    onDelete: (project: AdminProject) => void;
    onGenerateAI: (project: AdminProject) => void;
}

function actionButton(
    label: string,
    action: string,
    id: string,
    title: string,
    className: string,
): HTMLButtonElement {
    return h(
        'button',
        {
            type: 'button',
            class: `admin-action ${className}`,
            'data-action': action,
            'data-id': id,
            'aria-label': `${label} ${title}`,
        },
        label,
    );
}

/**
 * Render the projects table body with DOM nodes (no HTML strings).
 */
export function renderProjectRows(
    tbody: HTMLTableSectionElement,
    projects: AdminProject[],
    handlers: ProjectRowHandlers,
    emptyMessage = 'No projects found.',
    now: Date = new Date(),
): void {
    if (!projects.length) {
        renderMessageRow(tbody, TABLE_COLUMNS, emptyMessage);
        return;
    }

    tbody.replaceChildren(
        ...projects.map((project) => {
            const id = projectId(project);

            const edit = actionButton('Edit', 'edit', id, project.titolo, 'text-blue-300 hover:text-blue-200');
            const ai = actionButton('AI', 'ai', id, project.titolo, 'text-purple-300 hover:text-purple-200');
            const remove = actionButton('Delete', 'delete', id, project.titolo, 'text-red-300 hover:text-red-200');

            edit.addEventListener('click', () => handlers.onEdit(project));
            ai.addEventListener('click', () => handlers.onGenerateAI(project));
            remove.addEventListener('click', () => handlers.onDelete(project));

            const categories = getProjectCategories(project);

            return h(
                'tr',
                {
                    class: 'border-b border-white/5 hover:bg-white/5 transition-colors',
                    'data-project-id': id,
                },
                h(
                    'td',
                    { class: 'px-6 py-4' },
                    h('div', { class: 'font-medium text-white' }, project.titolo),
                    project.role
                        ? h('div', { class: 'text-xs text-slate-400' }, project.role)
                        : null,
                ),
                h(
                    'td',
                    { class: 'px-6 py-4' },
                    categories.length
                        ? categories.map(getCategoryLabel).join(', ')
                        : '—',
                ),
                h(
                    'td',
                    { class: 'px-6 py-4 hidden md:table-cell' },
                    (project.tecnologie ?? []).join(', ') || '—',
                ),
                h(
                    'td',
                    { class: 'px-6 py-4 hidden lg:table-cell text-slate-400' },
                    formatRelativeTime(project.updatedAt ?? project.createdAt, now),
                ),
                h(
                    'td',
                    { class: 'px-6 py-4 text-right whitespace-nowrap space-x-3' },
                    h(
                        'a',
                        {
                            href: `/projects/${slugify(project.titolo)}`,
                            target: '_blank',
                            rel: 'noopener',
                            class: 'admin-action text-emerald-300 hover:text-emerald-200',
                            'aria-label': `Preview ${project.titolo}`,
                        },
                        'Preview',
                    ),
                    edit,
                    ai,
                    remove,
                ),
            );
        }),
    );
}

const FIELD_IDS: Record<keyof ProjectFormValues, string> = {
    titolo: 'p-titolo',
    role: 'p-role',
    descrizione: 'p-descrizione',
    descrizioneLunga: 'p-descrizioneLunga',
    categorie: 'p-categorie',
    tecnologie: 'p-tecnologie',
    linkGithub: 'p-linkGithub',
    image: 'p-image',
    experienceId: 'p-experienceId',
};

type FieldElement =
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;

export function readProjectForm(
    doc: Document = document,
): ProjectFormValues {
    const values = {} as ProjectFormValues;

    for (const [key, id] of Object.entries(FIELD_IDS)) {
        values[key as keyof ProjectFormValues] =
            byId<FieldElement>(id, doc).value;
    }

    return values;
}

export function writeProjectForm(
    values: ProjectFormValues,
    doc: Document = document,
): void {
    for (const [key, id] of Object.entries(FIELD_IDS)) {
        byId<FieldElement>(id, doc).value =
            values[key as keyof ProjectFormValues];
    }
}

/**
 * Fill the experience <select> used to link a project to an experience.
 */
export function renderExperienceOptions(
    select: HTMLSelectElement,
    experiences: ExperienceOption[],
): void {
    select.replaceChildren(
        h('option', { value: '' }, 'No linked experience'),
        ...experiences.map((experience) =>
            h(
                'option',
                { value: projectId(experience) },
                `${experience.role} — ${experience.company}`,
            ),
        ),
    );
}

/**
 * Wire the projects page. Returns a reload function (used by tests).
 */
export function initProjectsPage(
    doc: Document = document,
): { reload: () => Promise<void> } {
    const tbody = byId<HTMLTableSectionElement>('projectsTableBody', doc);
    const dialog = byId<HTMLDialogElement>('projectDialog', doc);
    const form = byId<HTMLFormElement>('projectForm', doc);
    const title = byId('projectDialogTitle', doc);
    const errorBox = byId('projectFormError', doc);
    const saveButton = byId<HTMLButtonElement>('projectSaveBtn', doc);
    const search = byId<HTMLInputElement>('projectSearch', doc);
    const count = byId('projectCount', doc);
    const experienceSelect = byId<HTMLSelectElement>('p-experienceId', doc);

    let projects: AdminProject[] = [];
    let editing: AdminProject | null = null;

    const render = () => {
        const visible = filterProjects(projects, search.value);

        count.textContent =
            visible.length === projects.length
                ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
                : `${visible.length} of ${projects.length} projects`;

        renderProjectRows(
            tbody,
            visible,
            handlers,
            search.value ? 'No projects match your search.' : 'No projects yet. Create the first one.',
        );
    };

    const reload = async () => {
        const result = await apiRequest<AdminProject[]>('/api/projects?limit=100');

        if (!result.ok || !Array.isArray(result.data)) {
            projects = [];
            count.textContent = '';
            renderMessageRow(tbody, TABLE_COLUMNS, `Failed to load projects: ${result.message}`, 'error');
            return;
        }

        projects = result.data;
        render();
    };

    const loadExperiences = async () => {
        const result = await apiRequest<ExperienceOption[]>('/api/experiences?limit=100');

        renderExperienceOptions(
            experienceSelect,
            Array.isArray(result.data) ? result.data : [],
        );
    };

    const openEditor = (project: AdminProject | null) => {
        editing = project;
        form.reset();
        writeProjectForm(projectToForm(project), doc);
        setFormError(errorBox, null);
        title.textContent = project ? 'Edit Project' : 'New Project';
        openDialog(dialog);
        byId<HTMLInputElement>('p-titolo', doc).focus();
    };

    const handlers: ProjectRowHandlers = {
        onEdit: openEditor,

        onDelete: async (project) => {
            const confirmed = await confirmAction(
                `Delete "${project.titolo}"? This cannot be undone.`,
                'Delete',
                doc,
            );

            if (!confirmed) {
                return;
            }

            const result = await apiRequest(
                `/api/projects/${encodeURIComponent(projectId(project))}`,
                { method: 'DELETE' },
            );

            if (result.ok) {
                showToast(`Deleted "${project.titolo}".`, 'success', doc);
                await reload();
            } else {
                showToast(`Delete failed: ${result.message}`, 'error', doc);
            }
        },

        onGenerateAI: async (project) => {
            const result = await apiRequest(
                `/api/projects/${encodeURIComponent(projectId(project))}/generate-ai`,
                { method: 'POST' },
            );

            showToast(
                result.ok
                    ? `AI documentation regeneration started for "${project.titolo}".`
                    : `AI generation failed: ${result.message}`,
                result.ok ? 'success' : 'error',
                doc,
            );
        },
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const values = readProjectForm(doc);
        const validationError = validateProjectForm(values);

        if (validationError) {
            setFormError(errorBox, validationError);
            return;
        }

        const isUpdate = Boolean(editing);

        await withBusy(saveButton, 'Saving…', async () => {
            const result = await apiRequest(
                isUpdate
                    ? `/api/projects/${encodeURIComponent(projectId(editing!))}`
                    : '/api/projects',
                {
                    method: isUpdate ? 'PATCH' : 'POST',
                    body: formToPayload(values, isUpdate),
                },
            );

            if (!result.ok) {
                setFormError(errorBox, result.message);
                return;
            }

            closeDialog(dialog);
            showToast(isUpdate ? 'Project updated.' : 'Project created.', 'success', doc);
            await reload();
        });
    });

    byId('newProjectBtn', doc).addEventListener('click', () => openEditor(null));

    dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => closeDialog(dialog));
    });

    search.addEventListener('input', render);

    void loadExperiences();

    return {
        reload,
    };
}
