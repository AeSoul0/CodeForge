/**
 * @file src/scripts/particles.ts
 * @description Decorative animated particle network drawn on a canvas.
 *
 * The animation is disabled for reduced-motion users and on low-end devices
 * or slow connections, pauses while the tab is hidden, and is throttled to
 * 30 FPS on mobile/low-core hardware.
 */

export interface DeviceProfile {
    reducedMotion: boolean;
    viewportWidth: number;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    saveData?: boolean;
    effectiveType?: string;
    userAgent: string;
}

type NavigatorWithHints = Navigator & {
    deviceMemory?: number;
    connection?: {
        saveData?: boolean;
        effectiveType?: string;
    };
};

/**
 * Snapshot of the device capabilities relevant to the animation.
 */
export function readDeviceProfile(
    win: Window = window,
): DeviceProfile {
    const nav =
        win.navigator as NavigatorWithHints;

    return {
        reducedMotion: win.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches,
        viewportWidth: win.innerWidth,
        deviceMemory: nav.deviceMemory,
        hardwareConcurrency: nav.hardwareConcurrency,
        saveData: nav.connection?.saveData,
        effectiveType: nav.connection?.effectiveType,
        userAgent: nav.userAgent,
    };
}

/**
 * Whether the device should skip the animation entirely.
 */
export function isSlowDevice(
    profile: DeviceProfile,
): boolean {
    return Boolean(
        (profile.deviceMemory && profile.deviceMemory < 4) ||
        (profile.hardwareConcurrency && profile.hardwareConcurrency < 4) ||
        profile.saveData ||
        profile.effectiveType === '2g' ||
        profile.effectiveType === '3g',
    );
}

/**
 * Number of particles for the given device.
 */
export function getParticleCount(
    profile: DeviceProfile,
): number {
    if (
        profile.reducedMotion ||
        isSlowDevice(profile)
    ) {
        return 0;
    }

    if (profile.viewportWidth > 1440) {
        return 55;
    }

    if (profile.viewportWidth > 1024) {
        return 45;
    }

    if (profile.viewportWidth > 768) {
        return 30;
    }

    return 18;
}

/**
 * Frame-rate cap: 30 FPS on mobile or <=4 cores, 60 otherwise.
 */
export function getTargetFps(
    profile: DeviceProfile,
): number {
    const isLowEnd =
        Boolean(
            profile.hardwareConcurrency &&
            profile.hardwareConcurrency <= 4,
        ) ||
        /Mobi|Android/i.test(profile.userAgent);

    return isLowEnd
        ? 30
        : 60;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

export function createParticle(
    width: number,
    height: number,
    random: () => number = Math.random,
): Particle {
    return {
        x: random() * width,
        y: random() * height,
        vx: (random() - 0.5) * 0.55,
        vy: (random() - 0.5) * 0.55,
        color:
            random() > 0.5
                ? '6, 182, 212'
                : '99, 102, 241',
    };
}

/**
 * Advance a particle, bouncing off the viewport edges.
 */
export function stepParticle(
    particle: Particle,
    width: number,
    height: number,
): void {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (
        particle.x < 0 ||
        particle.x > width
    ) {
        particle.vx *= -1;
    }

    if (
        particle.y < 0 ||
        particle.y > height
    ) {
        particle.vy *= -1;
    }
}

const LINK_DISTANCE = 110;
const MOUSE_DISTANCE = 160;

function drawLine(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    style: string,
    width: number,
): void {
    ctx.beginPath();
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

/**
 * Draw one frame: particles, particle links and links to the pointer.
 */
export function drawFrame(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    pointer: { x: number; y: number } | null,
    width: number,
    height: number,
): void {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
        stepParticle(particle, width, height);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, 0.62)`;
        ctx.fill();
    }

    for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i];
            const b = particles[j];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);

            if (distance < LINK_DISTANCE) {
                const opacity = Math.max(0, 0.12 - distance / 900);
                drawLine(ctx, a, b, `rgba(${a.color}, ${opacity})`, 0.7);
            }
        }
    }

    if (!pointer) {
        return;
    }

    for (const particle of particles) {
        const distance = Math.hypot(
            particle.x - pointer.x,
            particle.y - pointer.y,
        );

        if (distance < MOUSE_DISTANCE) {
            const opacity = Math.max(0, 0.25 - distance / 640);
            drawLine(ctx, particle, pointer, `rgba(6, 182, 212, ${opacity})`, 0.9);
        }
    }
}

/**
 * Start the animation on a canvas. Returns a cleanup function.
 */
export function initParticleCanvas(
    canvas: HTMLCanvasElement,
    win: Window = window,
): () => void {
    const ctx =
        canvas.getContext('2d');

    if (!ctx) {
        return () => undefined;
    }

    const doc =
        win.document;

    const reducedMotion =
        win.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frameId: number | null = null;
    let lastFrame = 0;
    let pointer: { x: number; y: number } | null = null;
    let visible = !doc.hidden;

    const populate = () => {
        const count =
            getParticleCount(readDeviceProfile(win));

        particles = Array.from(
            { length: count },
            () => createParticle(width, height),
        );
    };

    const resize = () => {
        const dpr =
            Math.min(win.devicePixelRatio || 1, 2);

        width = win.innerWidth;
        height = win.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        populate();
    };

    const stop = () => {
        if (frameId !== null) {
            win.cancelAnimationFrame(frameId);
            frameId = null;
        }
    };

    const animate = (timestamp = 0) => {
        if (
            !visible ||
            particles.length === 0
        ) {
            stop();
            return;
        }

        frameId = win.requestAnimationFrame(animate);

        const frameDelay =
            1000 / getTargetFps(readDeviceProfile(win));

        if (timestamp - lastFrame < frameDelay) {
            return;
        }

        lastFrame = timestamp;

        drawFrame(ctx, particles, pointer, width, height);
    };

    const restart = () => {
        stop();

        if (
            !reducedMotion.matches &&
            visible
        ) {
            frameId = win.requestAnimationFrame(animate);
        }
    };

    const onPointerMove = (event: MouseEvent) => {
        pointer = {
            x: event.clientX,
            y: event.clientY,
        };
    };

    const onPointerLeave = () => {
        pointer = null;
    };

    const onVisibilityChange = () => {
        visible = !doc.hidden;

        if (visible) {
            restart();
        } else {
            stop();
        }
    };

    const onReducedMotionChange = () => {
        populate();

        if (reducedMotion.matches) {
            stop();
            ctx.clearRect(0, 0, width, height);
            return;
        }

        restart();
    };

    resize();

    win.addEventListener('resize', resize, { passive: true });
    win.addEventListener('mousemove', onPointerMove, { passive: true });
    win.addEventListener('mouseleave', onPointerLeave);
    doc.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.addEventListener('change', onReducedMotionChange);

    restart();

    const cleanup = () => {
        stop();
        win.removeEventListener('resize', resize);
        win.removeEventListener('mousemove', onPointerMove);
        win.removeEventListener('mouseleave', onPointerLeave);
        doc.removeEventListener('visibilitychange', onVisibilityChange);
        reducedMotion.removeEventListener('change', onReducedMotionChange);
    };

    win.addEventListener('beforeunload', cleanup, { once: true });

    return cleanup;
}
