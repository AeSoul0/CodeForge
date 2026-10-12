/**
 * @file src/lib/admin/login.ts
 * @description Login form behaviour.
 */

import {
    byId,
} from '../dom';

import {
    DASHBOARD_PATH,
    fetchSession,
    login,
} from './session';

import {
    setFormError,
} from './ui';

export function initLoginForm(
    doc: Document = document,
    navigate: (path: string) => void = (path) => {
        window.location.href = path;
    },
): { submit: () => Promise<void> } {
    const form = byId<HTMLFormElement>('loginForm', doc);
    const errorBox = byId('errorMsg', doc);
    const submitButton = byId<HTMLButtonElement>('loginSubmit', doc);

    const submit = async () => {
        const username = byId<HTMLInputElement>('username', doc).value.trim();
        const password = byId<HTMLInputElement>('password', doc).value;

        if (!username || !password) {
            setFormError(errorBox, 'Username and password are required.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Authenticating...';
        setFormError(errorBox, null);

        try {
            const error = await login(username, password);

            if (error) {
                setFormError(errorBox, error);
                return;
            }

            navigate(DASHBOARD_PATH);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        void submit();
    });

    return {
        submit,
    };
}

/**
 * Skip the login form when a valid session already exists.
 */
export async function redirectIfAuthenticated(
    navigate: (path: string) => void = (path) => {
        window.location.replace(path);
    },
): Promise<boolean> {
    const user = await fetchSession();

    if (user) {
        navigate(DASHBOARD_PATH);
        return true;
    }

    return false;
}
