// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createParticle,
    drawFrame,
    getParticleCount,
    getTargetFps,
    initParticleCanvas,
    isSlowDevice,
    readDeviceProfile,
    stepParticle,
    type DeviceProfile,
    type Particle,
} from '../../src/scripts/particles';

const desktop: DeviceProfile = {
    reducedMotion: false,
    viewportWidth: 1500,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    saveData: false,
    effectiveType: '4g',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
};

function fakeContext() {
    return {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        setTransform: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
    };
}

describe('device heuristics', () => {
    it('scales the particle count with the viewport', () => {
        expect(getParticleCount(desktop)).toBe(55);
        expect(getParticleCount({ ...desktop, viewportWidth: 1200 })).toBe(45);
        expect(getParticleCount({ ...desktop, viewportWidth: 900 })).toBe(30);
        expect(getParticleCount({ ...desktop, viewportWidth: 400 })).toBe(18);
    });

    it('disables the animation for reduced motion and slow devices', () => {
        expect(getParticleCount({ ...desktop, reducedMotion: true })).toBe(0);

        for (const slow of [
            { deviceMemory: 2 },
            { hardwareConcurrency: 2 },
            { saveData: true },
            { effectiveType: '2g' },
            { effectiveType: '3g' },
        ]) {
            expect(isSlowDevice({ ...desktop, ...slow })).toBe(true);
            expect(getParticleCount({ ...desktop, ...slow })).toBe(0);
        }

        expect(isSlowDevice({ ...desktop, deviceMemory: undefined, hardwareConcurrency: undefined })).toBe(false);
    });

    it('caps the frame rate on mobile and low-core devices', () => {
        expect(getTargetFps(desktop)).toBe(60);
        expect(getTargetFps({ ...desktop, hardwareConcurrency: 4 })).toBe(30);
        expect(getTargetFps({ ...desktop, userAgent: 'Android Mobile' })).toBe(30);
        expect(getTargetFps({ ...desktop, hardwareConcurrency: undefined })).toBe(60);
    });

    it('reads the profile from the window', () => {
        const profile = readDeviceProfile(window);

        expect(profile.viewportWidth).toBe(window.innerWidth);
        expect(typeof profile.reducedMotion).toBe('boolean');
    });
});

describe('particle physics and drawing', () => {
    it('creates particles inside the viewport with one of two colours', () => {
        const particle = createParticle(100, 50, () => 0.75);

        expect(particle).toEqual({ x: 75, y: 37.5, vx: 0.1375, vy: 0.1375, color: '6, 182, 212' });
        expect(createParticle(1, 1, () => 0.25).color).toBe('99, 102, 241');
        expect(createParticle(10, 10).x).toBeLessThanOrEqual(10);
    });

    it('bounces particles off the edges', () => {
        const particle: Particle = { x: 99.9, y: 0.1, vx: 1, vy: -1, color: '' };

        stepParticle(particle, 100, 100);

        expect(particle.vx).toBe(-1);
        expect(particle.vy).toBe(1);
    });

    it('draws particles, nearby links and pointer links', () => {
        const ctx = fakeContext();
        const particles: Particle[] = [
            { x: 10, y: 10, vx: 0, vy: 0, color: '1, 2, 3' },
            { x: 20, y: 10, vx: 0, vy: 0, color: '1, 2, 3' },
            { x: 500, y: 500, vx: 0, vy: 0, color: '1, 2, 3' },
        ];

        drawFrame(ctx as unknown as CanvasRenderingContext2D, particles, { x: 15, y: 10 }, 1000, 1000);

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1000, 1000);
        expect(ctx.arc).toHaveBeenCalledTimes(3);
        // one particle-particle link + two pointer links
        expect(ctx.stroke).toHaveBeenCalledTimes(3);

        ctx.stroke.mockClear();
        drawFrame(ctx as unknown as CanvasRenderingContext2D, particles, null, 1000, 1000);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
    });
});

describe('initParticleCanvas', () => {
    let rafCallbacks: FrameRequestCallback[];
    let motionListeners: Array<() => void>;
    let reducedMotion: { matches: boolean };
    let cleanups: Array<() => void> = [];

    beforeEach(() => {
        rafCallbacks = [];
        motionListeners = [];
        reducedMotion = { matches: false };

        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            rafCallbacks.push(callback);
            return rafCallbacks.length;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
        vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
            get matches() {
                return reducedMotion.matches;
            },
            addEventListener: (_: string, listener: () => void) => motionListeners.push(listener),
            removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList);

        Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: 8, configurable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1500, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
        Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    });

    afterEach(() => {
        cleanups.forEach((cleanup) => cleanup());
        cleanups = [];
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });

    function setup() {
        const canvas = document.createElement('canvas');
        const ctx = fakeContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

        const cleanup = initParticleCanvas(canvas, window);
        cleanups.push(cleanup);

        return { canvas, ctx, cleanup };
    }

    it('returns a no-op when 2D context is unavailable', () => {
        const canvas = document.createElement('canvas');
        vi.spyOn(canvas, 'getContext').mockReturnValue(null);

        expect(initParticleCanvas(canvas)()).toBeUndefined();
    });

    it('sizes the canvas for the device pixel ratio (capped at 2) and animates', () => {
        const { canvas, ctx } = setup();

        expect(canvas.width).toBe(3000);
        expect(canvas.style.width).toBe('1500px');
        expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

        rafCallbacks.shift()!(1000);
        expect(ctx.arc).toHaveBeenCalledTimes(55);

        // A frame arriving too early is skipped by the FPS throttle.
        ctx.arc.mockClear();
        rafCallbacks.shift()!(1001);
        expect(ctx.arc).not.toHaveBeenCalled();
    });

    it('tracks the pointer and forgets it when it leaves', () => {
        const { ctx } = setup();

        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
        rafCallbacks.shift()!(1000);
        const withPointer = ctx.stroke.mock.calls.length;

        window.dispatchEvent(new Event('mouseleave'));
        ctx.stroke.mockClear();
        rafCallbacks.shift()!(3000);

        expect(withPointer).toBeGreaterThanOrEqual(ctx.stroke.mock.calls.length);
    });

    it('pauses while the page is hidden and resumes when visible', () => {
        setup();

        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(window.cancelAnimationFrame).toHaveBeenCalled();

        // A queued frame while hidden stops the loop.
        rafCallbacks.shift()!(5000);

        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        const queued = rafCallbacks.length;
        document.dispatchEvent(new Event('visibilitychange'));
        expect(rafCallbacks.length).toBe(queued + 1);
    });

    it('reacts to reduced-motion changes', () => {
        const { ctx } = setup();

        reducedMotion.matches = true;
        motionListeners.forEach((listener) => listener());
        expect(ctx.clearRect).toHaveBeenCalled();

        reducedMotion.matches = false;
        const queued = rafCallbacks.length;
        motionListeners.forEach((listener) => listener());
        expect(rafCallbacks.length).toBe(queued + 1);
    });

    it('re-initialises on resize and cleans up listeners on unload', () => {
        const { canvas, cleanup } = setup();

        Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
        window.dispatchEvent(new Event('resize'));
        expect(canvas.style.width).toBe('800px');

        const removeSpy = vi.spyOn(window, 'removeEventListener');
        window.dispatchEvent(new Event('beforeunload'));
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

        cleanup();
    });

    it('uses a devicePixelRatio of 1 when unavailable', () => {
        Object.defineProperty(window, 'devicePixelRatio', { value: 0, configurable: true });
        const { ctx } = setup();

        expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    });
});
