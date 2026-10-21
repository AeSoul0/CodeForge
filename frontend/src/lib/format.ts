/**
 * @file src/lib/format.ts
 * @description Pure formatting helpers shared by public and admin pages.
 */

const monthFormatter =
    new Intl.DateTimeFormat(
        'en-US',
        {
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
        },
    );

function formatMonth(
    date: Date,
): string {
    return monthFormatter
        .format(date)
        .replace('.', '');
}

/**
 * Human-readable experience period, e.g. "Sep 2023 - Dec 2023".
 */
export function formatPeriod(
    startDate: string,
    endDate?: string | null,
    current = false,
): string {
    const start =
        new Date(startDate);

    if (Number.isNaN(start.getTime())) {
        return 'Date unavailable';
    }

    const startLabel =
        formatMonth(start);

    if (
        current ||
        !endDate
    ) {
        return `${startLabel} - Present`;
    }

    const end =
        new Date(endDate);

    if (Number.isNaN(end.getTime())) {
        return `${startLabel} - Present`;
    }

    return `${startLabel} - ${formatMonth(end)}`;
}

/**
 * Experience length in years with one decimal, e.g. "1.2+ yrs" for 14 months.
 *
 * Derived from the stored dates (nothing is saved): months are counted
 * inclusively in UTC, so Oct 2025 - Nov 2026 is 14 months, and ongoing roles
 * run until `now`. Returns null when the start date is unusable.
 */
export function formatExperienceDuration(
    startDate: string,
    endDate?: string | null,
    current = false,
    now: Date = new Date(),
): string | null {
    const start =
        new Date(startDate);

    if (Number.isNaN(start.getTime())) {
        return null;
    }

    const parsedEnd =
        current || !endDate
            ? now
            : new Date(endDate);

    const end =
        Number.isNaN(parsedEnd.getTime())
            ? now
            : parsedEnd;

    const months =
        (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        end.getUTCMonth() -
        start.getUTCMonth() +
        1;

    if (months < 1) {
        return null;
    }

    return `${(Math.round((months / 12) * 10) / 10).toFixed(1)}+ yrs`;
}

/**
 * Convert a project title into the URL slug used by /projects/[slug].
 *
 * "Città Digitale" -> "citta-digitale"
 */
export function slugify(
    value: string,
): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

/**
 * Slug of the project shown in the "Featured project" section. It has its
 * own hand-written case study (/projects/codeforge), so the grid skips it.
 */
export const FEATURED_PROJECT_SLUG = 'codeforge';

/** Maximum number of cards in the "Recent Projects" grid. */
export const MAX_GRID_PROJECTS = 4;

/**
 * Projects for the "Recent Projects" grid: everything except the featured
 * project, in API order, capped at {@link MAX_GRID_PROJECTS}.
 */
export function selectGridProjects<T extends { titolo: string }>(
    projects: T[],
): T[] {
    return projects
        .filter((project) => slugify(project.titolo) !== FEATURED_PROJECT_SLUG)
        .slice(0, MAX_GRID_PROJECTS);
}

const CATEGORY_LABELS: Record<string, string> = {
    'full-stack': 'Full Stack',
    embedded: 'Embedded',
    ai: 'AI',
    iot: 'IoT',
    data: 'Data',
};

export const BASE_CATEGORIES =
    Object.keys(CATEGORY_LABELS);

/**
 * Normalise category spellings ("Full Stack", "fullstack" -> "full-stack").
 */
export function normalizeCategory(
    category?: string | null,
): string {
    const value =
        (category || '').trim().toLowerCase();

    if (
        value === 'full stack' ||
        value === 'fullstack'
    ) {
        return 'full-stack';
    }

    return value;
}

/**
 * Display label for a category.
 */
export function getCategoryLabel(
    category: string,
): string {
    return (
        CATEGORY_LABELS[
            normalizeCategory(category)
        ] ?? category
    );
}

/**
 * Categories of a project, supporting the legacy single `categoria` field.
 */
export function getProjectCategories(
    project: {
        categorie?: string[] | null;
        categoria?: string | null;
    },
): string[] {
    if (
        Array.isArray(project.categorie) &&
        project.categorie.length > 0
    ) {
        return project.categorie;
    }

    return project.categoria
        ? [project.categoria]
        : [];
}

/**
 * Ordered filter list: known categories first, then custom ones.
 */
export function collectCategories(
    projects: Array<{
        categorie?: string[] | null;
        categoria?: string | null;
    }>,
): string[] {
    const present = [
        ...new Set(
            projects
                .flatMap(getProjectCategories)
                .map(normalizeCategory)
                .filter(Boolean),
        ),
    ];

    return [
        ...BASE_CATEGORIES.filter((category) =>
            present.includes(category),
        ),
        ...present.filter(
            (category) =>
                !BASE_CATEGORIES.includes(category),
        ),
    ];
}

/**
 * Parse a comma-separated input into a trimmed, de-duplicated list.
 */
export function parseList(
    value: string,
): string[] {
    return [
        ...new Set(
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ];
}

/**
 * Resolve an API-relative image path ("/api/...") against the backend URL.
 */
export function resolveImageUrl(
    image: string | null | undefined,
    apiUrl: string,
): string | null {
    if (!image) {
        return null;
    }

    return image.startsWith('/')
        ? `${apiUrl}${image}`
        : image;
}

/**
 * Compact relative time, e.g. "3 days ago".
 */
export function formatRelativeTime(
    value: string | Date | null | undefined,
    now: Date = new Date(),
): string {
    if (!value) {
        return '—';
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    const seconds =
        Math.round((now.getTime() - date.getTime()) / 1000);

    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];

    const formatter =
        new Intl.RelativeTimeFormat(
            'en',
            {
                numeric: 'auto',
            },
        );

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) {
            return formatter.format(
                -Math.round(seconds / size),
                unit,
            );
        }
    }

    return 'just now';
}
