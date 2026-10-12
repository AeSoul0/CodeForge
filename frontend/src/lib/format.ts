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
