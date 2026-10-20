import { describe, expect, it } from 'vitest';

import {
    collectCategories,
    formatExperienceDuration,
    formatPeriod,
    formatRelativeTime,
    getCategoryLabel,
    getProjectCategories,
    normalizeCategory,
    parseList,
    resolveImageUrl,
    slugify,
} from '../../src/lib/format';

describe('formatPeriod', () => {
    it('formats closed and ongoing periods in UTC', () => {
        expect(formatPeriod('2023-09-01T00:00:00.000Z', '2023-12-01T00:00:00.000Z')).toBe('Sep 2023 - Dec 2023');
        expect(formatPeriod('2025-09-01T00:00:00.000Z', null, true)).toBe('Sep 2025 - Present');
        expect(formatPeriod('2025-09-01T00:00:00.000Z')).toBe('Sep 2025 - Present');
    });

    it('handles invalid dates', () => {
        expect(formatPeriod('nope')).toBe('Date unavailable');
        expect(formatPeriod('2025-01-01', 'nope')).toBe('Jan 2025 - Present');
    });
});

describe('formatExperienceDuration', () => {
    const now = new Date('2026-10-20T12:00:00.000Z');

    it('counts inclusive months as decimal years', () => {
        // Oct 2025 - Nov 2026 = 14 months.
        expect(formatExperienceDuration('2025-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')).toBe('1.2+ yrs');
        expect(formatExperienceDuration('2023-09-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z')).toBe('0.5+ yrs');
        expect(formatExperienceDuration('2020-01-01T00:00:00.000Z', '2021-12-01T00:00:00.000Z')).toBe('2.0+ yrs');
    });

    it('runs ongoing roles until now', () => {
        expect(formatExperienceDuration('2025-10-01T00:00:00.000Z', null, true, now)).toBe('1.1+ yrs');
        expect(formatExperienceDuration('2025-10-01T00:00:00.000Z', 'nope', false, now)).toBe('1.1+ yrs');
    });

    it('returns null for unusable or future dates', () => {
        expect(formatExperienceDuration('nope')).toBeNull();
        expect(formatExperienceDuration('2027-01-01T00:00:00.000Z', null, true, now)).toBeNull();
    });
});

describe('slugify', () => {
    it.each([
        ['Città Digitale', 'citta-digitale'],
        ['  My   Project!  ', 'my-project'],
        ['CodeForge', 'codeforge'],
    ])('%s -> %s', (input, expected) => {
        expect(slugify(input)).toBe(expected);
    });
});

describe('categories', () => {
    it('normalises full-stack spellings and labels categories', () => {
        expect(normalizeCategory(' Full Stack ')).toBe('full-stack');
        expect(normalizeCategory('fullstack')).toBe('full-stack');
        expect(normalizeCategory(undefined)).toBe('');
        expect(getCategoryLabel('IOT')).toBe('IoT');
        expect(getCategoryLabel('Robotics')).toBe('Robotics');
    });

    it('supports the legacy single category field', () => {
        expect(getProjectCategories({ categorie: ['ai'] })).toEqual(['ai']);
        expect(getProjectCategories({ categorie: [], categoria: 'data' })).toEqual(['data']);
        expect(getProjectCategories({})).toEqual([]);
    });

    it('orders known categories first, then custom ones, without duplicates', () => {
        expect(
            collectCategories([
                { categorie: ['Robotics', 'AI'] },
                { categoria: 'full stack' },
                { categorie: ['ai', ''] },
            ]),
        ).toEqual(['full-stack', 'ai', 'robotics']);
    });
});

describe('parseList', () => {
    it('trims, drops empties and de-duplicates', () => {
        expect(parseList(' Astro, TS ,, Astro ,')).toEqual(['Astro', 'TS']);
        expect(parseList('')).toEqual([]);
    });
});

describe('resolveImageUrl', () => {
    it('prefixes API-relative paths only', () => {
        expect(resolveImageUrl('/api/x.png', 'http://api')).toBe('http://api/api/x.png');
        expect(resolveImageUrl('https://cdn/x.png', 'http://api')).toBe('https://cdn/x.png');
        expect(resolveImageUrl(null, 'http://api')).toBeNull();
    });
});

describe('formatRelativeTime', () => {
    const now = new Date('2026-01-10T12:00:00Z');

    it.each([
        ['2026-01-10T11:59:50Z', 'just now'],
        ['2026-01-10T11:55:00Z', '5 minutes ago'],
        ['2026-01-10T09:00:00Z', '3 hours ago'],
        ['2026-01-09T12:00:00Z', 'yesterday'],
        ['2025-11-10T12:00:00Z', '2 months ago'],
        ['2024-01-10T12:00:00Z', '2 years ago'],
    ])('%s -> %s', (value, expected) => {
        expect(formatRelativeTime(value, now)).toBe(expected);
    });

    it('returns a dash for missing or invalid values', () => {
        expect(formatRelativeTime(null, now)).toBe('—');
        expect(formatRelativeTime('nope', now)).toBe('—');
        expect(formatRelativeTime(new Date('2026-01-10T11:00:00Z'), now)).toBe('1 hour ago');
    });

    it('uses the current time by default', () => {
        expect(formatRelativeTime(new Date())).toBe('just now');
    });
});
