// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { applyProjectFilter, initProjectFilter } from '../../src/scripts/project-filter';

const markup = `
    <button class="cat-btn active" data-filter="all" aria-pressed="true">All</button>
    <button class="cat-btn" data-filter="ai" aria-pressed="false">AI</button>
    <button class="cat-btn" aria-pressed="false">Broken</button>
    <article class="project-card" data-categories="ai,data"></article>
    <article class="project-card" data-categories="embedded"></article>
    <article class="project-card"></article>
`;

describe('project filter', () => {
    it('applyProjectFilter hides non-matching cards', () => {
        document.body.innerHTML = markup;
        const cards = document.querySelectorAll('.project-card');

        expect(applyProjectFilter('ai', cards)).toBe(1);
        expect(cards[1].classList.contains('hidden')).toBe(true);
        expect(applyProjectFilter('all', cards)).toBe(3);
    });

    it('wires buttons, toggling pressed state', () => {
        document.body.innerHTML = markup;
        initProjectFilter();

        const [all, ai, broken] = document.querySelectorAll<HTMLButtonElement>('.cat-btn');
        const cards = document.querySelectorAll('.project-card');

        ai.click();
        expect(ai.getAttribute('aria-pressed')).toBe('true');
        expect(all.classList.contains('active')).toBe(false);
        expect([...cards].filter((card) => !card.classList.contains('hidden'))).toHaveLength(1);

        broken.click();
        expect([...cards].every((card) => !card.classList.contains('hidden'))).toBe(true);
    });

    it('announces how many projects are shown', () => {
        document.body.innerHTML = `${markup}<p id="project-filter-status" role="status"></p>`;
        initProjectFilter();

        const [all, ai] = document.querySelectorAll<HTMLButtonElement>('.cat-btn');
        const status = document.getElementById('project-filter-status');

        ai.click();
        expect(status?.textContent).toBe('Showing 1 project');
        all.click();
        expect(status?.textContent).toBe('Showing 3 projects');
    });
});
