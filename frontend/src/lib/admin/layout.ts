/**
 * @file src/lib/admin/layout.ts
 * @description Behaviour shared by every authenticated admin page:
 * session guard, active navigation, mobile menu and logout.
 */

import {
    logout,
    requireSession,
    type AdminUser,
} from './session';

import {
    showToast,
} from './ui';

/**
 * Mark the navigation link matching the current path with aria-current.
 */
export function markActiveLink(
    pathname: string,
    root: ParentNode = document,
): HTMLAnchorElement | null {
    const normalized = pathname.replace(/\/+$/, '') || '/';

    let active: HTMLAnchorElement | null = null;

    root.querySelectorAll<HTMLAnchorElement>('[data-admin-nav] a[href]').forEach((link) => {
        const matches = link.getAttribute('href') === normalized;

        if (matches) {
            link.setAttribute('aria-current', 'page');
            active = link;
        } else {
            link.removeAttribute('aria-current');
        }
    });

    return active;
}

/**
 * Toggle the mobile navigation panel.
 */
export function initMobileMenu(
    doc: Document = document,
): void {
    const toggle = doc.getElementById('adminMenuToggle');
    const panel = doc.getElementById('adminMobileNav');

    if (!toggle || !panel) {
        return;
    }

    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';

        toggle.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('hidden', !open);
    });
}

/**
 * Initialise the admin shell. Resolves with the user once the session has
 * been verified (null when redirected to the login page).
 */
export async function initAdminShell(
    doc: Document = document,
    pathname: string = window.location.pathname,
    navigate?: (path: string) => void,
): Promise<AdminUser | null> {
    markActiveLink(pathname, doc);
    initMobileMenu(doc);

    doc.querySelectorAll('[data-logout]').forEach((button) => {
        button.addEventListener('click', () => {
            void logout(navigate);
        });
    });

    const user = await requireSession(navigate, {}, (message) => {
        showToast(`Unable to verify your session: ${message}`, 'error', doc, 15_000);
    });

    if (user) {
        const name = doc.getElementById('adminUser');

        if (name) {
            name.textContent = user.username ?? 'admin';
        }

        doc.body.dataset.adminReady = 'true';
    }

    return user;
}
