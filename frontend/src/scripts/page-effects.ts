/**
 * @file src/scripts/page-effects.ts
 * @description Global page behaviour shared by every page of the site:
 * initial loader dismissal, section hash sync and scroll-reveal animations.
 */

/** Minimum time the initial loader stays visible, measured from navigation start. */
export const LOADER_MIN_VISIBLE_MS = 800;

/** Time to wait for the loader's exit transition before removing it. */
export const LOADER_EXIT_MS = 1100;

/**
 * Fade out and remove the initial loader once it has been visible long
 * enough. Safe to call multiple times.
 */
export function dismissLoader(
    doc: Document = document,
    now: number = performance.now(),
    schedule: (callback: () => void, delay: number) => unknown = (callback, delay) =>
        window.setTimeout(callback, delay),
): boolean {
    const loader =
        doc.getElementById('initial-loader');

    if (
        !loader ||
        loader.classList.contains('fade-out') ||
        loader.dataset.dismissing === 'true'
    ) {
        return false;
    }

    loader.dataset.dismissing = 'true';

    schedule(() => {
        loader.classList.add('fade-out');

        schedule(
            () => loader.remove(),
            LOADER_EXIT_MS,
        );
    }, Math.max(0, LOADER_MIN_VISIBLE_MS - now));

    return true;
}

/**
 * Keep `location.hash` in sync with the section currently in view.
 */
export function initSectionHashSync(
    sectionIds: string[] = ['home', 'projects&experiences'],
    win: Window = window,
): IntersectionObserver | null {
    const doc =
        win.document;

    const sections =
        sectionIds
            .map((id) => doc.getElementById(id))
            .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) {
        return null;
    }

    let currentHash =
        win.location.hash.replace('#', '');

    const setHash = (id: string) => {
        if (currentHash === id) {
            return;
        }

        currentHash = id;
        win.history.replaceState(null, '', `#${id}`);
    };

    const observer =
        new (win as Window & typeof globalThis).IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (
                        entry.isIntersecting &&
                        entry.target.id
                    ) {
                        setHash(entry.target.id);
                    }
                }
            },
            {
                root: null,
                rootMargin: '-20% 0px -40% 0px',
                threshold: [0, 0.15, 0.3],
            },
        );

    sections.forEach((section) => observer.observe(section));

    win.addEventListener(
        'scroll',
        () => {
            if (win.scrollY < 80) {
                setHash('home');
            }
        },
        {
            passive: true,
        },
    );

    return observer;
}

/**
 * Toggle `is-revealed` on `.reveal-up` / `.reveal-scale` elements as they
 * enter and leave the viewport, so the animation replays on scroll.
 */
export function initScrollReveal(
    win: Window = window,
): IntersectionObserver | null {
    const elements =
        win.document.querySelectorAll('.reveal-up, .reveal-scale');

    if (!elements.length) {
        return null;
    }

    const observer =
        new (win as Window & typeof globalThis).IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    entry.target.classList.toggle(
                        'is-revealed',
                        entry.isIntersecting,
                    );
                }
            },
            {
                root: null,
                rootMargin: '0px 0px -10% 0px',
                threshold: 0,
            },
        );

    elements.forEach((element) => observer.observe(element));

    return observer;
}

/**
 * Mark the hero as loaded on the next frame to start its entrance animation.
 */
export function revealHero(
    win: Window = window,
): boolean {
    const hero =
        win.document.getElementById('hero-section');

    if (!hero) {
        return false;
    }

    win.requestAnimationFrame(() => {
        hero.classList.add('is-loaded');
    });

    return true;
}

/**
 * Run a callback once the DOM is parsed.
 */
export function onReady(
    callback: () => void,
    doc: Document = document,
): void {
    if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}
