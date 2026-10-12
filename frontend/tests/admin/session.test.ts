// @vitest-environment happy-dom-ssr
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminLayout from '../../src/layouts/AdminLayout.astro';
import LoginPage from '../../src/pages/admin/login.astro';
import { adminSession, resetAdminSession, whenAuthenticated } from '../../src/lib/admin/boot';
import { initAdminShell, initMobileMenu, markActiveLink } from '../../src/lib/admin/layout';
import { initLoginForm, redirectIfAuthenticated } from '../../src/lib/admin/login';
import { checkSession, fetchSession, login, LOGIN_PATH, logout, requireSession } from '../../src/lib/admin/session';
import { flush, mockFetch, mountAstro } from '../helpers';

describe('session API', () => {
    it('fetchSession returns the user or null', async () => {
        mockFetch({ 'GET /api/auth/me': { body: { success: true, user: { username: 'admin' } } } });
        expect(await fetchSession()).toEqual({ username: 'admin' });

        mockFetch({ 'GET /api/auth/me': { body: { success: true } } });
        expect(await fetchSession()).toEqual({});

        mockFetch({ 'GET /api/auth/me': { status: 401, body: {} } });
        expect(await fetchSession()).toBeNull();
    });

    it('requireSession redirects anonymous visitors', async () => {
        const navigate = vi.fn();

        mockFetch({ 'GET /api/auth/me': { status: 401 } });
        expect(await requireSession(navigate)).toBeNull();
        expect(navigate).toHaveBeenCalledWith(LOGIN_PATH);

        mockFetch({ 'GET /api/auth/me': { body: { user: { username: 'a' } } } });
        navigate.mockClear();
        expect(await requireSession(navigate)).toEqual({ username: 'a' });
        expect(navigate).not.toHaveBeenCalled();
    });

    it('distinguishes anonymous visitors from an unavailable backend', async () => {
        mockFetch({ 'GET /api/auth/me': { status: 403, body: {} } });
        expect(await checkSession()).toEqual({ state: 'anonymous' });

        mockFetch({ 'GET /api/auth/me': { status: 429, body: {} } });
        expect(await checkSession()).toEqual({ state: 'unavailable', message: 'Too many requests. Please wait a moment and reload.' });

        mockFetch({ 'GET /api/auth/me': { status: 500, body: { message: 'boom' } } });
        expect(await checkSession()).toEqual({ state: 'unavailable', message: 'boom' });
    });

    it('requireSession does not log out on transient failures', async () => {
        const navigate = vi.fn();
        const onUnavailable = vi.fn();

        mockFetch({ 'GET /api/auth/me': { status: 503, body: { message: 'down' } } });
        expect(await requireSession(navigate, {}, onUnavailable)).toBeNull();
        expect(navigate).not.toHaveBeenCalled();
        expect(onUnavailable).toHaveBeenCalledWith('down');

        // The default handler is a no-op.
        expect(await requireSession(navigate)).toBeNull();
    });

    it('login maps status codes to messages', async () => {
        mockFetch({ 'POST /api/auth/login': { body: { success: true } } });
        expect(await login('a', 'b')).toBeNull();

        mockFetch({ 'POST /api/auth/login': { status: 401, body: { message: 'x' } } });
        expect(await login('a', 'b')).toBe('Invalid credentials');

        mockFetch({ 'POST /api/auth/login': { status: 429, body: {} } });
        expect(await login('a', 'b')).toContain('Too many attempts');

        mockFetch({ 'POST /api/auth/login': { status: 403, body: { error: { message: 'Request origin is not allowed.' } } } });
        expect(await login('a', 'b')).toBe('Request origin is not allowed.');
    });

    it('logout always navigates to the login page', async () => {
        const navigate = vi.fn();

        mockFetch({ 'POST /api/auth/logout': { body: { success: true } } });
        await logout(navigate);
        expect(navigate).toHaveBeenCalledWith(LOGIN_PATH);

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
        navigate.mockClear();
        await logout(navigate);
        expect(navigate).toHaveBeenCalledWith(LOGIN_PATH);
    });

    it('default navigation helpers use window.location', async () => {
        const replace = vi.fn();
        const location = { ...window.location, replace, href: '', pathname: '/admin/dashboard' };
        vi.stubGlobal('location', location);
        Object.defineProperty(window, 'location', { value: location, configurable: true });

        mockFetch({ 'GET /api/auth/me': { status: 401 }, 'POST /api/auth/logout': { body: {} } });

        await requireSession();
        expect(replace).toHaveBeenCalledWith(LOGIN_PATH);

        await logout();
        expect(location.href).toBe(LOGIN_PATH);
    });
});

describe('admin shell', () => {
    beforeEach(async () => {
        resetAdminSession();
        await mountAstro(AdminLayout, { props: { title: 'Test' }, slots: { default: '<h1>Body</h1>' } });
    });

    it('marks the active link in both navigations', () => {
        const active = markActiveLink('/admin/dashboard/projects/');

        expect(active?.textContent?.trim()).toBe('Projects');
        expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(2);

        markActiveLink('/elsewhere');
        expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
        expect(markActiveLink('/', document.createElement('div'))).toBeNull();
    });

    it('toggles the mobile menu and tolerates missing markup', () => {
        initMobileMenu();
        const toggle = document.getElementById('adminMenuToggle')!;
        const panel = document.getElementById('adminMobileNav')!;

        toggle.click();
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(panel.classList.contains('hidden')).toBe(false);

        toggle.click();
        expect(panel.classList.contains('hidden')).toBe(true);

        document.body.innerHTML = '';
        expect(() => initMobileMenu()).not.toThrow();
    });

    it('verifies the session, shows the user and wires logout', async () => {
        const navigate = vi.fn();
        mockFetch({
            'GET /api/auth/me': { body: { user: { username: 'root' } } },
            'POST /api/auth/logout': { body: { success: true } },
        });

        const user = await initAdminShell(document, '/admin/dashboard', navigate);

        expect(user).toEqual({ username: 'root' });
        expect(document.getElementById('adminUser')!.textContent).toBe('root');
        expect(document.body.dataset.adminReady).toBe('true');

        document.querySelector<HTMLButtonElement>('[data-logout]')!.click();
        await flush();
        expect(navigate).toHaveBeenCalledWith(LOGIN_PATH);
    });

    it('falls back to "admin" without a username and handles a missing user slot', async () => {
        mockFetch({ 'GET /api/auth/me': { body: {} } });
        await initAdminShell(document, '/admin/dashboard', vi.fn());
        expect(document.getElementById('adminUser')!.textContent).toBe('admin');

        document.getElementById('adminUser')!.remove();
        await expect(initAdminShell(document, '/admin/dashboard', vi.fn())).resolves.toEqual({});
    });

    it('warns instead of redirecting when the backend is unavailable', async () => {
        const navigate = vi.fn();
        mockFetch({ 'GET /api/auth/me': { status: 429, body: {} } });

        expect(await initAdminShell(document, '/admin/dashboard', navigate)).toBeNull();
        expect(navigate).not.toHaveBeenCalled();
        expect(document.getElementById('toastRegion')!.textContent).toContain('Unable to verify your session');
    });

    it('redirects without a session', async () => {
        const navigate = vi.fn();
        mockFetch({ 'GET /api/auth/me': { status: 401 } });

        expect(await initAdminShell(document, '/admin/dashboard', navigate)).toBeNull();
        expect(navigate).toHaveBeenCalledWith(LOGIN_PATH);
        expect(document.body.dataset.adminReady).toBeUndefined();
    });

    it('boot shares one session check and gates page initialisers', async () => {
        const replace = vi.fn();
        Object.defineProperty(window, 'location', { value: { ...window.location, replace, pathname: '/admin/dashboard' }, configurable: true });

        const fetchMock = mockFetch({ 'GET /api/auth/me': { body: { user: { username: 'a' } } } });
        const init = vi.fn();

        expect(await whenAuthenticated(init)).toBe(true);
        expect(await adminSession()).toEqual({ username: 'a' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledTimes(1);

        resetAdminSession();
        mockFetch({ 'GET /api/auth/me': { status: 401 } });
        init.mockClear();
        expect(await whenAuthenticated(init)).toBe(false);
        expect(init).not.toHaveBeenCalled();
    });
});

describe('login page', () => {
    beforeEach(async () => {
        await mountAstro(LoginPage);
    });

    const field = (id: string) => document.getElementById(id) as HTMLInputElement;

    it('requires both fields', async () => {
        const { submit } = initLoginForm(document, vi.fn());

        await submit();

        expect(document.getElementById('errorMsg')!.textContent).toBe('Username and password are required.');
    });

    it('signs in and navigates to the dashboard', async () => {
        const navigate = vi.fn();
        const fetchMock = mockFetch({ 'POST /api/auth/login': { body: { success: true } } });
        initLoginForm(document, navigate);

        field('username').value = ' admin ';
        field('password').value = 'secret';
        document.getElementById('loginForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
        await flush();

        expect(JSON.parse(String(fetchMock.mock.calls[0][1]!.body))).toEqual({ username: 'admin', password: 'secret' });
        expect(navigate).toHaveBeenCalledWith('/admin/dashboard');
    });

    it('shows errors and restores the button', async () => {
        mockFetch({ 'POST /api/auth/login': { status: 401, body: {} } });
        const { submit } = initLoginForm(document, vi.fn());

        field('username').value = 'admin';
        field('password').value = 'wrong';
        await submit();

        expect(document.getElementById('errorMsg')!.textContent).toBe('Invalid credentials');
        expect(document.getElementById('errorMsg')!.classList.contains('hidden')).toBe(false);
        expect((document.getElementById('loginSubmit') as HTMLButtonElement).textContent).toBe('Sign In');
    });

    it('skips the form for authenticated visitors', async () => {
        const navigate = vi.fn();

        mockFetch({ 'GET /api/auth/me': { body: { user: {} } } });
        expect(await redirectIfAuthenticated(navigate)).toBe(true);
        expect(navigate).toHaveBeenCalledWith('/admin/dashboard');

        mockFetch({ 'GET /api/auth/me': { status: 401 } });
        expect(await redirectIfAuthenticated(navigate)).toBe(false);
    });

    it('uses window.location by default', async () => {
        const location = { ...window.location, href: '', replace: vi.fn() };
        Object.defineProperty(window, 'location', { value: location, configurable: true });

        mockFetch({ 'POST /api/auth/login': { body: {} }, 'GET /api/auth/me': { body: { user: {} } } });
        const { submit } = initLoginForm();
        field('username').value = 'a';
        field('password').value = 'b';
        await submit();
        expect(location.href).toBe('/admin/dashboard');

        await redirectIfAuthenticated();
        expect(location.replace).toHaveBeenCalledWith('/admin/dashboard');
    });
});
