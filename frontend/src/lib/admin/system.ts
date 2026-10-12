/**
 * @file src/lib/admin/system.ts
 * @description Backend health and runtime metrics for the System page.
 */

import {
    apiRequest,
} from '../api';

import {
    byId,
} from '../dom';

export interface BackendMetrics {
    requestsCount: number;
    errorCount: number;
    statusCodes: Record<string, number>;
    averageLatencyMs: number;
    databaseState: string;
}

export type ProbeState =
    | 'ok'
    | 'degraded'
    | 'down';

export interface SystemSnapshot {
    live: ProbeState;
    ready: ProbeState;
    latencyMs: number | null;
    metrics: BackendMetrics | null;
}

function probeState(
    status: number,
): ProbeState {
    if (status >= 200 && status < 300) {
        return 'ok';
    }

    return status === 0
        ? 'down'
        : 'degraded';
}

/**
 * Query /live, /ready and /metrics in parallel.
 */
export async function fetchSystemSnapshot(
    clock: () => number = () => performance.now(),
): Promise<SystemSnapshot> {
    const started = clock();

    const [live, ready, metrics] = await Promise.all([
        apiRequest('/live'),
        apiRequest('/ready'),
        apiRequest('/metrics'),
    ]);

    return {
        live: probeState(live.status),
        ready: probeState(ready.status),
        latencyMs: live.status ? Math.round(clock() - started) : null,
        metrics: metrics.ok && metrics.body && typeof metrics.body === 'object'
            ? metrics.body as BackendMetrics
            : null,
    };
}

export function errorRate(
    metrics: BackendMetrics,
): number {
    if (!metrics.requestsCount) {
        return 0;
    }

    const failures =
        (metrics.statusCodes['4xx'] ?? 0) + (metrics.statusCodes['5xx'] ?? 0);

    return failures / metrics.requestsCount;
}

const STATE_LABELS: Record<'live' | 'ready', Record<ProbeState, string>> = {
    live: { ok: 'Online', degraded: 'Degraded', down: 'Unreachable' },
    ready: { ok: 'Connected', degraded: 'Disconnected', down: 'Unreachable' },
};

const DOT_CLASSES: Record<ProbeState, string> = {
    ok: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    down: 'bg-red-500',
};

function setProbe(
    doc: Document,
    probe: 'live' | 'ready',
    state: ProbeState,
): void {
    const dot = byId(`status-${probe}`, doc);
    const text = byId(`text-${probe}`, doc);

    dot.className = `w-2.5 h-2.5 rounded-full ${DOT_CLASSES[state]}`;
    dot.dataset.state = state;
    text.textContent = STATE_LABELS[probe][state];
}

/**
 * Write a snapshot into the System page.
 */
export function renderSnapshot(
    snapshot: SystemSnapshot,
    doc: Document = document,
): void {
    setProbe(doc, 'live', snapshot.live);
    setProbe(doc, 'ready', snapshot.ready);

    byId('metric-latency', doc).textContent =
        snapshot.latencyMs === null ? '—' : `${snapshot.latencyMs} ms`;

    const metrics = snapshot.metrics;

    byId('metric-requests', doc).textContent =
        metrics ? metrics.requestsCount.toLocaleString('en-US') : '—';

    byId('metric-error-rate', doc).textContent =
        metrics ? `${(errorRate(metrics) * 100).toFixed(1)}%` : '—';

    byId('metric-avg-latency', doc).textContent =
        metrics ? `${metrics.averageLatencyMs.toFixed(1)} ms` : '—';

    for (const bucket of ['2xx', '3xx', '4xx', '5xx']) {
        byId(`metric-${bucket}`, doc).textContent =
            metrics ? String(metrics.statusCodes[bucket] ?? 0) : '—';
    }

    byId('metricsRaw', doc).textContent =
        metrics ? JSON.stringify(metrics, null, 2) : 'Metrics unavailable.';

    byId('lastChecked', doc).textContent =
        `Last checked ${new Date().toLocaleTimeString()}`;
}

export const AUTO_REFRESH_MS = 30_000;

export function initSystemPage(
    doc: Document = document,
): { refresh: () => Promise<void>; stop: () => void } {
    const button = byId<HTMLButtonElement>('refreshBtn', doc);
    const autoRefresh = byId<HTMLInputElement>('autoRefresh', doc);

    let timer: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
        button.disabled = true;
        button.textContent = 'Refreshing…';

        try {
            renderSnapshot(await fetchSystemSnapshot(), doc);
        } finally {
            button.disabled = false;
            button.textContent = 'Refresh';
        }
    };

    const stop = () => {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };

    autoRefresh.addEventListener('change', () => {
        stop();

        if (autoRefresh.checked) {
            timer = setInterval(() => void refresh(), AUTO_REFRESH_MS);
        }
    });

    button.addEventListener('click', () => void refresh());

    return {
        refresh,
        stop,
    };
}
