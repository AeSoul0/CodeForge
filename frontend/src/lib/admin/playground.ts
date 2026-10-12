/**
 * @file src/lib/admin/playground.ts
 * @description In-browser API client for exercising backend endpoints with
 * the current administrator session.
 */

import {
    apiRequest,
    type HttpMethod,
} from '../api';

import {
    byId,
    h,
} from '../dom';

export interface PlaygroundPreset {
    label: string;
    method: HttpMethod;
    endpoint: string;
    body?: unknown;
}

export const PRESETS: PlaygroundPreset[] = [
    { label: 'List projects', method: 'GET', endpoint: '/api/projects?limit=10' },
    {
        label: 'Create project',
        method: 'POST',
        endpoint: '/api/projects',
        body: {
            titolo: 'Playground Project',
            descrizione: 'Created from the admin API playground.',
            tecnologie: ['TypeScript'],
        },
    },
    { label: 'List experiences', method: 'GET', endpoint: '/api/experiences?limit=10' },
    {
        label: 'Create experience',
        method: 'POST',
        endpoint: '/api/experiences',
        body: {
            role: 'Test Role',
            company: 'Test Company',
            description: 'Created from the admin API playground.',
            technologies: ['Node.js'],
            startDate: '2026-01',
            current: true,
        },
    },
    { label: 'Current session', method: 'GET', endpoint: '/api/auth/me' },
    { label: 'Liveness probe', method: 'GET', endpoint: '/live' },
    { label: 'Readiness probe', method: 'GET', endpoint: '/ready' },
    { label: 'Runtime metrics', method: 'GET', endpoint: '/metrics' },
];

export const HISTORY_KEY = 'codeforge.apiHistory';
export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
    method: HttpMethod;
    endpoint: string;
    status: number;
    time: string;
}

/**
 * Read the request history, tolerating blocked or corrupted storage.
 */
export function loadHistory(
    storage: Storage | null = safeStorage(),
): HistoryEntry[] {
    try {
        const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) ?? '[]');

        return Array.isArray(parsed)
            ? parsed.filter(
                (entry): entry is HistoryEntry =>
                    entry &&
                    typeof entry.method === 'string' &&
                    typeof entry.endpoint === 'string',
            )
            : [];
    } catch {
        return [];
    }
}

export function saveHistory(
    entries: HistoryEntry[],
    storage: Storage | null = safeStorage(),
): void {
    try {
        storage?.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
    } catch {
        // Storage may be full or disabled; history is a convenience only.
    }
}

export function safeStorage(): Storage | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function methodAllowsBody(
    method: string,
): boolean {
    return method !== 'GET' && method !== 'DELETE';
}

export type ParsedRequest =
    | { ok: true; method: HttpMethod; endpoint: string; body?: unknown }
    | { ok: false; error: string };

/**
 * Validate the request editor's contents.
 */
export function parseRequest(
    method: string,
    endpoint: string,
    bodyText: string,
): ParsedRequest {
    const path = endpoint.trim();

    if (!path.startsWith('/') || path.startsWith('//')) {
        return { ok: false, error: 'Endpoint must be a path starting with "/".' };
    }

    if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
        return { ok: false, error: `Unsupported method ${method}.` };
    }

    const typedMethod = method as HttpMethod;

    if (!methodAllowsBody(typedMethod) || !bodyText.trim()) {
        return { ok: true, method: typedMethod, endpoint: path };
    }

    try {
        return { ok: true, method: typedMethod, endpoint: path, body: JSON.parse(bodyText) };
    } catch {
        return { ok: false, error: 'Request body is not valid JSON.' };
    }
}

export function statusTone(
    status: number,
): string {
    if (status >= 200 && status < 300) {
        return 'text-emerald-300';
    }

    if (status >= 300 && status < 400) {
        return 'text-yellow-300';
    }

    return 'text-red-300';
}

export function formatResponseBody(
    body: unknown,
): string {
    if (body === null || body === undefined) {
        return '(empty response)';
    }

    return typeof body === 'string'
        ? body
        : JSON.stringify(body, null, 2);
}

export function renderHistory(
    list: HTMLElement,
    entries: HistoryEntry[],
    onSelect: (entry: HistoryEntry) => void,
): void {
    if (!entries.length) {
        list.replaceChildren(h('li', { class: 'text-xs text-slate-500' }, 'No requests yet'));
        return;
    }

    list.replaceChildren(
        ...entries.map((entry) => {
            const button = h(
                'button',
                {
                    type: 'button',
                    class: 'w-full flex items-center gap-2 text-left text-xs font-mono hover:bg-white/5 p-1 rounded',
                },
                h('span', { class: 'text-blue-300 w-14 shrink-0' }, entry.method),
                h('span', { class: 'text-slate-300 flex-1 truncate' }, entry.endpoint),
                h('span', { class: statusTone(entry.status) }, entry.status ? String(entry.status) : 'ERR'),
                h('span', { class: 'text-slate-500' }, entry.time),
            );

            button.addEventListener('click', () => onSelect(entry));

            return h('li', {}, button);
        }),
    );
}

export function initPlayground(
    doc: Document = document,
    storage: Storage | null = safeStorage(),
): { send: () => Promise<void> } {
    const presetSelect = byId<HTMLSelectElement>('apiPreset', doc);
    const methodSelect = byId<HTMLSelectElement>('apiMethod', doc);
    const endpointInput = byId<HTMLInputElement>('apiEndpoint', doc);
    const bodyInput = byId<HTMLTextAreaElement>('apiBody', doc);
    const sendButton = byId<HTMLButtonElement>('sendBtn', doc);
    const output = byId('apiResponse', doc);
    const statusOutput = byId('resStatus', doc);
    const timeOutput = byId('resTime', doc);
    const historyList = byId('historyList', doc);
    const clearHistoryButton = byId<HTMLButtonElement>('clearHistoryBtn', doc);

    presetSelect.replaceChildren(
        h('option', { value: '' }, 'Choose a preset…'),
        ...PRESETS.map((preset, index) =>
            h('option', { value: String(index) }, `${preset.method} · ${preset.label}`),
        ),
    );

    const syncBodyState = () => {
        bodyInput.disabled = !methodAllowsBody(methodSelect.value);
    };

    const select = (method: string, endpoint: string, body: string) => {
        methodSelect.value = method;
        endpointInput.value = endpoint;
        bodyInput.value = body;
        syncBodyState();
    };

    const refreshHistory = () => {
        renderHistory(historyList, loadHistory(storage), (entry) => select(entry.method, entry.endpoint, ''));
    };

    presetSelect.addEventListener('change', () => {
        const preset = PRESETS[Number(presetSelect.value)];

        if (presetSelect.value !== '' && preset) {
            select(preset.method, preset.endpoint, preset.body ? JSON.stringify(preset.body, null, 2) : '');
        }
    });

    methodSelect.addEventListener('change', syncBodyState);

    const send = async () => {
        const parsed = parseRequest(methodSelect.value, endpointInput.value, bodyInput.value);

        if (!parsed.ok) {
            statusOutput.textContent = 'Status: invalid request';
            statusOutput.className = 'text-red-300';
            output.textContent = parsed.error;
            return;
        }

        sendButton.disabled = true;
        sendButton.textContent = 'Sending…';
        output.textContent = 'Loading…';

        const started = performance.now();

        const result = await apiRequest(parsed.endpoint, {
            method: parsed.method,
            body: parsed.body,
        });

        const elapsed = Math.round(performance.now() - started);

        statusOutput.textContent = result.status
            ? `Status: ${result.status}`
            : 'Status: network error';
        statusOutput.className = statusTone(result.status);
        timeOutput.textContent = `Time: ${elapsed} ms`;
        output.textContent = result.status
            ? formatResponseBody(result.body)
            : result.message;

        if (result.status === 401) {
            output.textContent += '\n\nYour session has expired. Sign in again to call protected endpoints.';
        }

        saveHistory(
            [
                {
                    method: parsed.method,
                    endpoint: parsed.endpoint,
                    status: result.status,
                    time: new Date().toLocaleTimeString(),
                },
                ...loadHistory(storage),
            ],
            storage,
        );
        refreshHistory();

        sendButton.disabled = false;
        sendButton.textContent = 'Send';
    };

    sendButton.addEventListener('click', () => {
        void send();
    });

    clearHistoryButton.addEventListener('click', () => {
        saveHistory([], storage);
        refreshHistory();
    });

    syncBodyState();
    refreshHistory();

    return {
        send,
    };
}
