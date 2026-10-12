// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    dismissLoader,
    initScrollReveal,
    initSectionHashSync,
    LOADER_EXIT_MS,
    LOADER_MIN_VISIBLE_MS,
    onReady,
    revealHero,
} from '../../src/scripts/page-effects';

type ObserverCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

let observerCallbacks: ObserverCallback[];

class FakeObserver {
    observed: Element[] = [];

    constructor(callback: ObserverCallback) {
        observerCallbacks.push(callback);
    }

    observe(element: Element) {
        this.observed.push(element);
    }
}

beforeEach(() => {
    document.body.innerHTML = '';
    observerCallbacks = [];
    vi.stubGlobal('IntersectionObserver', FakeObserver);
});

describe('dismissLoader', () => {
    it('waits for the minimum visible time, fades out, then removes the loader', () => {
        document.body.innerHTML = '<div id="initial-loader"></div>';
        const delays: number[] = [];
        const callbacks: Array<() => void> = [];

        const scheduled = dismissLoader(document, 300, (callback, delay) => {
            delays.push(delay);
            callbacks.push(callback);
        });

        expect(scheduled).toBe(true);
        expect(delays[0]).toBe(LOADER_MIN_VISIBLE_MS - 300);

        callbacks[0]();
        const loader = document.getElementById('initial-loader')!;
        expect(loader.classList.contains('fade-out')).toBe(true);
        expect(delays[1]).toBe(LOADER_EXIT_MS);

        callbacks[1]();
        expect(document.getElementById('initial-loader')).toBeNull();
    });

    it('is idempotent and tolerates a missing loader', () => {
        document.body.innerHTML = '<div id="initial-loader"></div>';
        const schedule = vi.fn();

        expect(dismissLoader(document, 5000, schedule)).toBe(true);
        expect(schedule).toHaveBeenCalledWith(expect.any(Function), 0);
        expect(dismissLoader(document, 5000, schedule)).toBe(false);

        document.body.innerHTML = '<div id="initial-loader" class="fade-out"></div>';
        expect(dismissLoader(document, 0, schedule)).toBe(false);

        document.body.innerHTML = '';
        expect(dismissLoader()).toBe(false);
    });

    it('uses real timers by default', () => {
        vi.useFakeTimers();
        document.body.innerHTML = '<div id="initial-loader"></div>';

        dismissLoader(document, LOADER_MIN_VISIBLE_MS);
        vi.advanceTimersByTime(LOADER_EXIT_MS);

        expect(document.getElementById('initial-loader')).toBeNull();
        vi.useRealTimers();
    });
});

describe('initSectionHashSync', () => {
    it('returns null when no section exists', () => {
        expect(initSectionHashSync(['missing'])).toBeNull();
    });

    it('updates the hash for intersecting sections and resets near the top', () => {
        document.body.innerHTML = '<section id="home"></section><section id="projects"></section>';
        const replaceState = vi.spyOn(window.history, 'replaceState');

        expect(initSectionHashSync(['home', 'projects', 'missing'])).not.toBeNull();

        const projects = document.getElementById('projects')!;
        const [callback] = observerCallbacks;

        callback([{ isIntersecting: true, target: projects }]);
        callback([{ isIntersecting: true, target: projects }]);
        callback([{ isIntersecting: false, target: document.getElementById('home')! }]);

        expect(replaceState).toHaveBeenCalledTimes(1);
        expect(replaceState).toHaveBeenLastCalledWith(null, '', '#projects');

        Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
        window.dispatchEvent(new Event('scroll'));
        expect(replaceState).toHaveBeenCalledTimes(1);

        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
        window.dispatchEvent(new Event('scroll'));
        expect(replaceState).toHaveBeenLastCalledWith(null, '', '#home');
    });
});

describe('initScrollReveal', () => {
    it('returns null without reveal targets', () => {
        expect(initScrollReveal()).toBeNull();
    });

    it('toggles is-revealed as elements enter and leave the viewport', () => {
        document.body.innerHTML = '<div class="reveal-up"></div><div class="reveal-scale"></div>';
        const observer = initScrollReveal() as unknown as FakeObserver;
        const [first] = document.querySelectorAll('.reveal-up');

        expect(observer.observed).toHaveLength(2);

        observerCallbacks[0]([{ isIntersecting: true, target: first }]);
        expect(first.classList.contains('is-revealed')).toBe(true);

        observerCallbacks[0]([{ isIntersecting: false, target: first }]);
        expect(first.classList.contains('is-revealed')).toBe(false);
    });
});

describe('revealHero / onReady', () => {
    it('adds is-loaded on the next frame', () => {
        expect(revealHero()).toBe(false);

        document.body.innerHTML = '<section id="hero-section"></section>';
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback(0);
            return 1;
        });

        expect(revealHero()).toBe(true);
        expect(document.getElementById('hero-section')!.classList.contains('is-loaded')).toBe(true);
    });

    it('runs immediately when the DOM is ready, or on DOMContentLoaded', () => {
        const callback = vi.fn();
        onReady(callback);
        expect(callback).toHaveBeenCalledTimes(1);

        const loadingDoc = { readyState: 'loading', addEventListener: vi.fn() } as unknown as Document;
        onReady(callback, loadingDoc);
        expect(loadingDoc.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', callback, { once: true });
    });
});
