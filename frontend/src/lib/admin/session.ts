/**
 * @file src/lib/admin/session.ts
 * @description Administrator session helpers.
 *
 * The JWT lives in an HttpOnly cookie that JavaScript cannot read, so the
 * session is verified by asking the backend (`GET /api/auth/me`).
 */

import {
    apiRequest,
    type ApiRequestOptions,
} from '../api';

export const LOGIN_PATH = '/admin/login';
export const DASHBOARD_PATH = '/admin/dashboard';

export interface AdminUser {
    id?: string;
    username?: string;
    role?: string;
}

type Navigate = (path: string) => void;

const defaultNavigate: Navigate = (path) => {
    window.location.replace(path);
};

export type SessionCheck =
    | { state: 'authenticated'; user: AdminUser }
    | { state: 'anonymous' }
    | { state: 'unavailable'; message: string };

/**
 * Ask the backend whether the session cookie is valid.
 *
 * Only 401/403 mean "not signed in"; rate limiting, server errors and
 * network failures are reported as `unavailable` so a transient problem
 * never looks like a logout.
 */
export async function checkSession(
    options: Pick<ApiRequestOptions, 'fetchImpl' | 'baseUrl'> = {},
): Promise<SessionCheck> {
    const result =
        await apiRequest<never>(
            '/api/auth/me',
            options,
        );

    if (result.ok) {
        return {
            state: 'authenticated',
            user: (result.body as { user?: AdminUser } | null)?.user ?? {},
        };
    }

    if (
        result.status === 401 ||
        result.status === 403
    ) {
        return {
            state: 'anonymous',
        };
    }

    return {
        state: 'unavailable',
        message: result.status === 429
            ? 'Too many requests. Please wait a moment and reload.'
            : result.message,
    };
}

/**
 * Return the signed-in administrator, or null when not authenticated.
 */
export async function fetchSession(
    options: Pick<ApiRequestOptions, 'fetchImpl' | 'baseUrl'> = {},
): Promise<AdminUser | null> {
    const session =
        await checkSession(options);

    return session.state === 'authenticated'
        ? session.user
        : null;
}

/**
 * Redirect to the login page when the visitor is not signed in.
 *
 * Resolves with the user, or null when redirected or when the backend
 * could not be reached (`onUnavailable` receives the reason).
 */
export async function requireSession(
    navigate: Navigate = defaultNavigate,
    options: Pick<ApiRequestOptions, 'fetchImpl' | 'baseUrl'> = {},
    onUnavailable: (message: string) => void = () => undefined,
): Promise<AdminUser | null> {
    const session =
        await checkSession(options);

    if (session.state === 'authenticated') {
        return session.user;
    }

    if (session.state === 'anonymous') {
        navigate(LOGIN_PATH);
    } else {
        onUnavailable(session.message);
    }

    return null;
}

/**
 * Submit credentials. Resolves with an error message, or null on success.
 */
export async function login(
    username: string,
    password: string,
    options: Pick<ApiRequestOptions, 'fetchImpl' | 'baseUrl'> = {},
): Promise<string | null> {
    const result =
        await apiRequest(
            '/api/auth/login',
            {
                ...options,
                method: 'POST',
                body: {
                    username,
                    password,
                },
            },
        );

    if (result.ok) {
        return null;
    }

    if (result.status === 401) {
        return 'Invalid credentials';
    }

    if (result.status === 429) {
        return 'Too many attempts. Please wait a minute and try again.';
    }

    return result.message;
}

/**
 * End the session and go back to the login page, even if the request fails.
 */
export async function logout(
    navigate: Navigate = (path) => {
        window.location.href = path;
    },
    options: Pick<ApiRequestOptions, 'fetchImpl' | 'baseUrl'> = {},
): Promise<void> {
    try {
        await apiRequest(
            '/api/auth/logout',
            {
                ...options,
                method: 'POST',
            },
        );
    } finally {
        navigate(LOGIN_PATH);
    }
}
