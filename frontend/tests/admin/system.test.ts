// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SystemPage from '../../src/pages/admin/dashboard/system.astro';
import {
    AUTO_REFRESH_MS,
    errorRate,
    fetchSystemSnapshot,
    initSystemPage,
    renderSnapshot,
    type BackendMetrics,
} from '../../src/lib/admin/system';
import { flush, mockFetch, mountAstro } from '../helpers';

const metrics: BackendMetrics = {
    requestsCount: 1200,
    errorCount: 3,
    statusCodes: { '2xx': 1000, '3xx': 50, '4xx': 147, '5xx': 3 },
    averageLatencyMs: 12.345,
    databaseState: 'connected',
};

describe('system helpers', () => {
    it('computes the client+server error rate', () => {
        expect(errorRate(metrics)).toBeCloseTo(0.125);
        expect(errorRate({ ...metrics, requestsCount: 0 })).toBe(0);
        expect(errorRate({ ...metrics, statusCodes: {} })).toBe(0);
    });

    it('builds a snapshot from the probes', async () => {
        mockFetch({
            'GET /live': { body: { status: 'ok' } },
            'GET /ready': { status: 503, body: { status: 'unavailable' } },
            'GET /metrics': { body: metrics },
        });

        let tick = 0;
        const snapshot = await fetchSystemSnapshot(() => (tick += 40));

        expect(snapshot).toEqual({ live: 'ok', ready: 'degraded', latencyMs: 40, metrics });
    });

    it('marks everything down when the backend is unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

        expect(await fetchSystemSnapshot()).toEqual({ live: 'down', ready: 'down', latencyMs: null, metrics: null });
    });
});

describe('system page', () => {
    beforeEach(async () => {
        await mountAstro(SystemPage);
    });

    const text = (id: string) => document.getElementById(id)!.textContent;

    it('renders healthy and missing snapshots', () => {
        renderSnapshot({ live: 'ok', ready: 'ok', latencyMs: 42, metrics });

        expect(text('text-live')).toBe('Online');
        expect(text('text-ready')).toBe('Connected');
        expect(text('metric-requests')).toBe('1,200');
        expect(text('metric-error-rate')).toBe('12.5%');
        expect(text('metric-avg-latency')).toBe('12.3 ms');
        expect(text('metric-latency')).toBe('42 ms');
        expect(text('metric-4xx')).toBe('147');
        expect(document.getElementById('status-live')!.dataset.state).toBe('ok');

        renderSnapshot({ live: 'down', ready: 'degraded', latencyMs: null, metrics: { ...metrics, statusCodes: {} } });
        expect(text('text-live')).toBe('Unreachable');
        expect(text('text-ready')).toBe('Disconnected');
        expect(text('metric-latency')).toBe('—');
        expect(text('metric-2xx')).toBe('0');

        renderSnapshot({ live: 'down', ready: 'down', latencyMs: null, metrics: null });
        expect(text('metric-requests')).toBe('—');
        expect(text('metricsRaw')).toBe('Metrics unavailable.');
    });

    it('refreshes on demand and on a timer', async () => {
        vi.useFakeTimers();
        const fetchMock = mockFetch({
            'GET /live': { body: {} },
            'GET /ready': { body: {} },
            'GET /metrics': { body: metrics },
        });

        const page = initSystemPage();
        await page.refresh();
        expect(text('text-live')).toBe('Online');
        expect(fetchMock).toHaveBeenCalledTimes(3);

        document.getElementById('refreshBtn')!.click();
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchMock).toHaveBeenCalledTimes(6);

        const auto = document.getElementById('autoRefresh') as HTMLInputElement;
        auto.checked = true;
        auto.dispatchEvent(new Event('change'));
        await vi.advanceTimersByTimeAsync(AUTO_REFRESH_MS);
        expect(fetchMock).toHaveBeenCalledTimes(9);

        auto.checked = false;
        auto.dispatchEvent(new Event('change'));
        await vi.advanceTimersByTimeAsync(AUTO_REFRESH_MS);
        expect(fetchMock).toHaveBeenCalledTimes(9);

        page.stop();
        vi.useRealTimers();
        await flush();
    });

    it('shows the API host and mode', () => {
        expect(document.body.textContent).toContain('codeforge-ukq5.onrender.com');
    });
});
