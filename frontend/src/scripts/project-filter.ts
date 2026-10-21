/**
 * @file src/scripts/project-filter.ts
 * @description Category filter buttons for the public projects grid.
 */

/**
 * Show only the cards whose `data-categories` contains the filter.
 * Returns the number of visible cards.
 */
export function applyProjectFilter(
    filter: string,
    cards: Iterable<Element>,
): number {
    let visibleCount = 0;

    for (const card of cards) {
        const categories =
            (card.getAttribute('data-categories') || '').split(',');

        const visible =
            filter === 'all' ||
            categories.includes(filter);

        card.classList.toggle('hidden', !visible);

        if (visible) {
            visibleCount += 1;
        }
    }

    return visibleCount;
}

/**
 * Wire the `.cat-btn` buttons inside `root` to filter `.project-card`s and
 * announce the result in `#project-filter-status` (a polite live region).
 */
export function initProjectFilter(
    root: ParentNode = document,
): void {
    const buttons =
        Array.from(root.querySelectorAll<HTMLElement>('.cat-btn'));

    const cards =
        Array.from(root.querySelectorAll('.project-card'));

    const status =
        root.querySelector<HTMLElement>('#project-filter-status');

    for (const button of buttons) {
        button.addEventListener('click', () => {
            for (const other of buttons) {
                const active = other === button;

                other.classList.toggle('active', active);
                other.setAttribute('aria-pressed', String(active));
            }

            const visible = applyProjectFilter(
                button.getAttribute('data-filter') || 'all',
                cards,
            );

            if (status) {
                status.textContent =
                    `Showing ${visible} ${visible === 1 ? 'project' : 'projects'}`;
            }
        });
    }
}
