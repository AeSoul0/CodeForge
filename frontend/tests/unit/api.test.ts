import { describe, expect, it, vi } from 'vitest';

import {
    apiRequest,
    buildHeaders,
    CSRF_HEADER_NAME,
    CSRF_HEADER_VALUE,
    DEFAULT_API_URL,
    extractList,
    extractMessage,
    getApiUrl,
    resolveApiUrl,
} from '../../src/lib/api';
import { mockFetch } from '../helpers';

describe('resolveApiUrl', () => {
    it('trims trailing slashes and whitespace', () => {
        expect(resolveApiUrl(' https://api.example.com/// ')).toBe('https://api.example.com');
    });

    it('falls back when unset or blank', () => {
        expect(resolveApiUrl(undefined)).toBe(DEFAULT_API_URL);
        expect(resolveApiUrl('   ', 'http://fallback/')).toBe('http://fallback');
        expect(resolveApiUrl(null)).toBe(DEFAULT_API_URL);
    });

    it('getApiUrl reads PUBLIC_API_URL', () => {
        vi.stubEnv('PUBLIC_API_URL', 'http://configured:1234/');
        expect(getApiUrl()).toBe('http://configured:1234');
        vi.unstubAllEnvs();
    });
});

describe('extractMessage', () => {
    it.each([
        [{ message: 'top' }, 'top'],
        [{ error: 'flat' }, 'flat'],
        [{ error: { message: 'nested' } }, 'nested'],
        ['plain text', 'plain text'],
        [{ error: { code: 'X' } }, 'fallback'],
        [{ message: '' }, 'fallback'],
        [null, 'fallback'],
        [42, 'fallback'],
        ['   ', 'fallback'],
    ])('%j -> %s', (body, expected) => {
        expect(extractMessage(body, 'fallback')).toBe(expected);
    });
});

describe('buildHeaders', () => {
    it('adds the anti-CSRF header only to unsafe methods', () => {
        expect(buildHeaders('GET', false)).not.toHaveProperty(CSRF_HEADER_NAME);
        expect(buildHeaders('delete', false)[CSRF_HEADER_NAME]).toBe(CSRF_HEADER_VALUE);
    });

    it('sets a JSON content type only with a body and keeps extra headers', () => {
        expect(buildHeaders('POST', true, { 'X-Extra': '1' })).toMatchObject({
            'Content-Type': 'application/json',
            'X-Extra': '1',
            Accept: 'application/json',
        });
        expect(buildHeaders('POST', false)).not.toHaveProperty('Content-Type');
    });
});

describe('apiRequest', () => {
    it('sends credentials, no-store and a JSON body', async () => {
        const fetchMock = mockFetch({ 'POST /api/things': { status: 201, body: { success: true, data: { id: 1 } } } });

        const result = await apiRequest<{ id: number }>('/api/things', {
            method: 'POST',
            body: { a: 1 },
            baseUrl: 'http://api',
        });

        expect(result).toMatchObject({ ok: true, status: 201, data: { id: 1 }, message: 'OK' });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('http://api/api/things');
        expect(init).toMatchObject({ method: 'POST', credentials: 'include', cache: 'no-store', body: '{"a":1}' });
        expect((init?.headers as Record<string, string>)[CSRF_HEADER_NAME]).toBe(CSRF_HEADER_VALUE);
    });

    it('returns null data for bodies without a data key and text bodies', async () => {
        mockFetch({
            'GET /plain': { body: 'hello' },
            'GET /empty': { status: 204 },
            'GET /json': { body: { status: 'ok' } },
        });

        expect(await apiRequest('/plain', { baseUrl: 'http://a' })).toMatchObject({ body: 'hello', data: null });
        expect(await apiRequest('/empty', { baseUrl: 'http://a' })).toMatchObject({ body: null, ok: true });
        expect(await apiRequest('/json', { baseUrl: 'http://a' })).toMatchObject({ body: { status: 'ok' }, data: null });
    });

    it('surfaces backend error messages and a default for unknown failures', async () => {
        mockFetch({
            'GET /bad': { status: 400, body: { error: { message: 'Bad input' } } },
            'GET /boom': { status: 500, body: { error: { code: 'X' } } },
        });

        expect(await apiRequest('/bad', { baseUrl: 'http://a' })).toMatchObject({ ok: false, status: 400, message: 'Bad input' });
        expect((await apiRequest('/boom', { baseUrl: 'http://a' })).message).toBe('Request failed with status 500');
    });

    it('resolves network failures with status 0', async () => {
        const fetchImpl = vi.fn().mockRejectedValue(new TypeError('offline'));

        expect(await apiRequest('/x', { fetchImpl, baseUrl: 'http://a' })).toEqual({
            ok: false,
            status: 0,
            data: null,
            body: null,
            message: 'Network error. The backend might be unreachable.',
        });
    });

    it('uses the configured API URL and honours a custom cache mode', async () => {
        const fetchMock = mockFetch({ 'GET /x': { body: {} } });

        await apiRequest('/x', { cache: 'default' });

        expect(fetchMock.mock.calls[0][0]).toBe(`${DEFAULT_API_URL}/x`);
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'default' });
    });
});

describe('extractList', () => {
    it('unwraps arrays and { data: [] } payloads', () => {
        expect(extractList([1])).toEqual([1]);
        expect(extractList({ data: [2] })).toEqual([2]);
        expect(extractList({ data: 'x' })).toBeNull();
        expect(extractList(null)).toBeNull();
    });
});
