/**
 * @file src/lib/admin/boot.ts
 * @description Single shared session check per admin page load.
 *
 * Both the layout script and the page script import this module; Astro
 * bundles them into the same module graph, so the backend is asked once.
 */

import {
    initAdminShell,
} from './layout';

import type {
    AdminUser,
} from './session';

let session: Promise<AdminUser | null> | null = null;

export function adminSession(): Promise<AdminUser | null> {
    session ??= initAdminShell();

    return session;
}

/**
 * Run a page initialiser only after the session has been verified.
 */
export async function whenAuthenticated(
    init: () => unknown,
): Promise<boolean> {
    const user = await adminSession();

    if (!user) {
        return false;
    }

    await init();

    return true;
}

/** Test helper: forget the cached session. */
export function resetAdminSession(): void {
    session = null;
}
