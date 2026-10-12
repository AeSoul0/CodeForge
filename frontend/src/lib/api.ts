/**
 * @file src/lib/api.ts
 * @description Shared HTTP client for the CodeForge backend.
 *
 * Every browser request that can change state carries the anti-CSRF
 * header required by the backend (see backend/src/middlewares/csrf.ts)
 * and sends the HttpOnly session cookie with `credentials: "include"`.
 */

export const DEFAULT_API_URL =
    'https://codeforge-ukq5.onrender.com';

export const CSRF_HEADER_NAME =
    'X-Requested-With';

export const CSRF_HEADER_VALUE =
    'CodeForge';

const SAFE_METHODS =
    new Set([
        'GET',
        'HEAD',
        'OPTIONS',
    ]);

export type HttpMethod =
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE';

export interface ApiResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    body: unknown;
    message: string;
}

export interface ApiRequestOptions {
    method?: HttpMethod;
    body?: unknown;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    headers?: Record<string, string>;
    cache?: RequestCache;
}

/**
 * Normalise a configured API URL, falling back to the production backend.
 */
export function resolveApiUrl(
    configured: string | undefined | null,
    fallback: string = DEFAULT_API_URL,
): string {
    const value =
        configured?.trim();

    return (value || fallback).replace(/\/+$/, '');
}

/**
 * API base URL for the current build.
 */
export function getApiUrl(): string {
    return resolveApiUrl(
        import.meta.env.PUBLIC_API_URL,
    );
}

/**
 * Extract a human-readable message from the backend's response shapes:
 * `{ message }`, `{ error: { message } }` and `{ error: "..." }`.
 */
export function extractMessage(
    body: unknown,
    fallback: string,
): string {
    if (
        typeof body === 'string' &&
        body.trim()
    ) {
        return body;
    }

    if (
        !body ||
        typeof body !== 'object'
    ) {
        return fallback;
    }

    const record =
        body as Record<string, unknown>;

    if (
        typeof record.message === 'string' &&
        record.message
    ) {
        return record.message;
    }

    const error =
        record.error;

    if (
        typeof error === 'string' &&
        error
    ) {
        return error;
    }

    if (
        error &&
        typeof error === 'object' &&
        typeof (error as Record<string, unknown>).message === 'string'
    ) {
        return (error as Record<string, string>).message;
    }

    return fallback;
}

/**
 * Build request headers, adding the anti-CSRF header to unsafe methods.
 */
export function buildHeaders(
    method: string,
    hasBody: boolean,
    extra: Record<string, string> = {},
): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...extra,
    };

    if (hasBody) {
        headers['Content-Type'] =
            'application/json';
    }

    if (
        !SAFE_METHODS.has(
            method.toUpperCase(),
        )
    ) {
        headers[CSRF_HEADER_NAME] =
            CSRF_HEADER_VALUE;
    }

    return headers;
}

async function readBody(
    response: Response,
): Promise<unknown> {
    const text =
        await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/**
 * Perform a request against the backend and normalise the result.
 *
 * Network failures resolve with `status: 0` instead of throwing so callers
 * can render a single error path.
 */
export async function apiRequest<T = unknown>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
    const method =
        options.method ?? 'GET';

    const hasBody =
        options.body !== undefined;

    const fetchImpl =
        options.fetchImpl ?? fetch;

    const baseUrl =
        options.baseUrl ?? getApiUrl();

    try {
        const response =
            await fetchImpl(
                `${baseUrl}${path}`,
                {
                    method,
                    credentials: 'include',
                    // Admin views must never show a stale list after a write.
                    cache: options.cache ?? 'no-store',
                    headers: buildHeaders(
                        method,
                        hasBody,
                        options.headers,
                    ),
                    body: hasBody
                        ? JSON.stringify(options.body)
                        : undefined,
                },
            );

        const body =
            await readBody(response);

        const data =
            body &&
            typeof body === 'object' &&
            'data' in body
                ? (body as { data: T }).data
                : null;

        return {
            ok: response.ok,
            status: response.status,
            data,
            body,
            message: extractMessage(
                body,
                response.ok
                    ? 'OK'
                    : `Request failed with status ${response.status}`,
            ),
        };
    } catch {
        return {
            ok: false,
            status: 0,
            data: null,
            body: null,
            message:
                'Network error. The backend might be unreachable.',
        };
    }
}

/**
 * Unwrap collection responses that are either `{ data: [] }` or `[]`.
 */
export function extractList<T>(
    body: unknown,
): T[] | null {
    if (Array.isArray(body)) {
        return body as T[];
    }

    if (
        body &&
        typeof body === 'object' &&
        Array.isArray((body as { data?: unknown }).data)
    ) {
        return (body as { data: T[] }).data;
    }

    return null;
}
