// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApiPage from '../../src/pages/admin/dashboard/api.astro';
import {
    formatResponseBody,
    HISTORY_KEY,
    HISTORY_LIMIT,
    initPlayground,
    loadHistory,
    methodAllowsBody,
    parseRequest,
    PRESETS,
    renderHistory,
    safeStorage,
    saveHistory,
    statusTone,
} from '../../src/lib/admin/playground';
import { flush, jsonBody, mockFetch, mountAstro } from '../helpers';

class MemoryStorage {
    data = new Map<string, string>();
    getItem(key: string) { return this.data.get(key) ?? null; }
    setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('request parsing', () => {
    it('validates the endpoint, method and JSON body', () => {
        expect(parseRequest('GET', 'api', '')).toEqual({ ok: false, error: 'Endpoint must be a path starting with "/".' });
        expect(parseRequest('GET', '//evil.example', '').ok).toBe(false);
        expect(parseRequest('TRACE', '/x', '')).toEqual({ ok: false, error: 'Unsupported method TRACE.' });
        expect(parseRequest('POST', '/x', '{bad')).toEqual({ ok: false, error: 'Request body is not valid JSON.' });
        expect(parseRequest('POST', ' /x ', '{"a":1}')).toEqual({ ok: true, method: 'POST', endpoint: '/x', body: { a: 1 } });
        expect(parseRequest('POST', '/x', '  ')).toEqual({ ok: true, method: 'POST', endpoint: '/x' });
        expect(parseRequest('DELETE', '/x', '{"ignored":true}')).toEqual({ ok: true, method: 'DELETE', endpoint: '/x' });
    });

    it('knows which methods carry a body', () => {
        expect(methodAllowsBody('GET')).toBe(false);
        expect(methodAllowsBody('DELETE')).toBe(false);
        expect(methodAllowsBody('PATCH')).toBe(true);
    });

    it('formats responses and status tones', () => {
        expect(formatResponseBody(null)).toBe('(empty response)');
        expect(formatResponseBody('text')).toBe('text');
        expect(formatResponseBody({ a: 1 })).toBe('{\n  "a": 1\n}');
        expect(statusTone(200)).toBe('text-emerald-300');
        expect(statusTone(304)).toBe('text-yellow-300');
        expect(statusTone(404)).toBe('text-red-300');
    });

    it('only offers presets for real endpoints', () => {
        expect(PRESETS.every((preset) => preset.endpoint.startsWith('/'))).toBe(true);
        expect(PRESETS.some((preset) => preset.endpoint.includes('/api/system'))).toBe(false);
    });
});

describe('history storage', () => {
    it('round-trips, truncates and tolerates corrupt or blocked storage', () => {
        const storage = new MemoryStorage() as unknown as Storage;
        const entry = { method: 'GET' as const, endpoint: '/x', status: 200, time: 'now' };

        saveHistory(Array.from({ length: 15 }, () => entry), storage);
        expect(loadHistory(storage)).toHaveLength(HISTORY_LIMIT);

        storage.setItem(HISTORY_KEY, '{nope');
        expect(loadHistory(storage)).toEqual([]);

        storage.setItem(HISTORY_KEY, JSON.stringify({ not: 'array' }));
        expect(loadHistory(storage)).toEqual([]);

        storage.setItem(HISTORY_KEY, JSON.stringify([entry, { method: 1 }, null]));
        expect(loadHistory(storage)).toEqual([entry]);

        const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } } as unknown as Storage;
        expect(loadHistory(throwing)).toEqual([]);
        expect(() => saveHistory([entry], throwing)).not.toThrow();
        expect(loadHistory(null)).toEqual([]);
    });

    it('safeStorage returns localStorage or null when access throws', () => {
        expect(safeStorage()).toBe(window.localStorage);

        const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
        expect(safeStorage()).toBeNull();
        spy.mockRestore();
    });

    it('renders history entries as buttons', () => {
        const list = document.createElement('ul');
        const onSelect = vi.fn();

        renderHistory(list, [], onSelect);
        expect(list.textContent).toBe('No requests yet');

        renderHistory(list, [{ method: 'GET', endpoint: '/<b>x</b>', status: 0, time: 't' }], onSelect);
        expect(list.querySelector('b')).toBeNull();
        expect(list.textContent).toContain('ERR');

        list.querySelector('button')!.click();
        expect(onSelect).toHaveBeenCalled();
    });
});

describe('initPlayground', () => {
    let storage: Storage;

    beforeEach(async () => {
        await mountAstro(ApiPage);
        storage = new MemoryStorage() as unknown as Storage;
    });

    const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

    it('fills presets, sends requests and records history', async () => {
        const fetchMock = mockFetch({
            'POST /api/projects': (init) => ({ status: 201, body: { echo: jsonBody(init) } }),
        });

        const playground = initPlayground(document, storage);
        const preset = el<HTMLSelectElement>('apiPreset');

        expect(preset.options).toHaveLength(PRESETS.length + 1);

        preset.value = String(PRESETS.findIndex((item) => item.label === 'Create project'));
        preset.dispatchEvent(new Event('change'));
        expect(el<HTMLSelectElement>('apiMethod').value).toBe('POST');
        expect(el<HTMLTextAreaElement>('apiBody').disabled).toBe(false);

        await playground.send();

        expect(el('resStatus').textContent).toBe('Status: 201');
        expect(el('apiResponse').textContent).toContain('Playground Project');
        expect(el('historyList').textContent).toContain('/api/projects');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });

        // Selecting an empty preset leaves the editor untouched.
        preset.value = '';
        preset.dispatchEvent(new Event('change'));
        expect(el<HTMLInputElement>('apiEndpoint').value).toBe('/api/projects');

        // Clicking a history entry restores method and endpoint.
        el<HTMLSelectElement>('apiMethod').value = 'GET';
        el('historyList').querySelector('button')!.click();
        expect(el<HTMLSelectElement>('apiMethod').value).toBe('POST');

        el('clearHistoryBtn').click();
        expect(el('historyList').textContent).toBe('No requests yet');
    });

    it('disables the body editor for GET and DELETE', () => {
        initPlayground(document, storage);
        const method = el<HTMLSelectElement>('apiMethod');

        method.value = 'DELETE';
        method.dispatchEvent(new Event('change'));

        expect(el<HTMLTextAreaElement>('apiBody').disabled).toBe(true);
    });

    it('reports invalid requests, 401s and network errors', async () => {
        initPlayground(document, storage);

        el<HTMLInputElement>('apiEndpoint').value = 'no-slash';
        el<HTMLButtonElement>('sendBtn').click();
        await flush();
        expect(el('apiResponse').textContent).toContain('must be a path');

        mockFetch({ 'GET /api/auth/me': { status: 401, body: { message: 'Authentication required' } } });
        el<HTMLInputElement>('apiEndpoint').value = '/api/auth/me';
        el<HTMLButtonElement>('sendBtn').click();
        await flush();
        expect(el('resStatus').className).toBe('text-red-300');
        expect(el('apiResponse').textContent).toContain('session has expired');

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
        el<HTMLButtonElement>('sendBtn').click();
        await flush();
        expect(el('resStatus').textContent).toBe('Status: network error');
        expect(el('apiResponse').textContent).toContain('Network error');
        expect(el<HTMLButtonElement>('sendBtn').disabled).toBe(false);
    });

    it('uses localStorage by default', () => {
        window.localStorage.clear();
        expect(() => initPlayground()).not.toThrow();
    });
});
