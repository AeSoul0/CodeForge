/**
 * @file src/lib/admin/ui.ts
 * @description Shared admin UI primitives: toasts, dialogs and busy states.
 */

import {
    h,
} from '../dom';

export type ToastTone =
    | 'success'
    | 'error'
    | 'info';

const TOAST_CLASSES: Record<ToastTone, string> = {
    success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
    error: 'border-red-400/40 bg-red-500/15 text-red-100',
    info: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
};

export const TOAST_DURATION_MS = 4000;

/**
 * Show a transient notification in the `#toastRegion` live region.
 */
export function showToast(
    message: string,
    tone: ToastTone = 'info',
    doc: Document = document,
    duration: number = TOAST_DURATION_MS,
): HTMLElement | null {
    const region =
        doc.getElementById('toastRegion');

    if (!region) {
        return null;
    }

    const toast =
        h(
            'div',
            {
                class: `admin-toast rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${TOAST_CLASSES[tone]}`,
                role: tone === 'error' ? 'alert' : 'status',
                'data-tone': tone,
            },
            message,
        );

    region.append(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);

    return toast;
}

/**
 * Open a native <dialog> as a modal (focus trap and Escape handling are
 * provided by the browser). Falls back to the `open` attribute.
 */
export function openDialog(
    dialog: HTMLDialogElement,
): void {
    if (dialog.open) {
        return;
    }

    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

export function closeDialog(
    dialog: HTMLDialogElement,
): void {
    if (typeof dialog.close === 'function') {
        dialog.close();
    } else {
        dialog.removeAttribute('open');
    }
}

/**
 * Ask for confirmation with the layout's `#confirmDialog`.
 * Resolves true when the user confirms.
 */
export function confirmAction(
    message: string,
    confirmLabel = 'Delete',
    doc: Document = document,
): Promise<boolean> {
    const dialog =
        doc.getElementById('confirmDialog') as HTMLDialogElement | null;

    if (!dialog) {
        return Promise.resolve(false);
    }

    const text =
        dialog.querySelector('[data-confirm-message]');

    const confirmButton =
        dialog.querySelector<HTMLButtonElement>('[data-confirm-accept]');

    const cancelButton =
        dialog.querySelector<HTMLButtonElement>('[data-confirm-cancel]');

    if (text) {
        text.textContent = message;
    }

    if (confirmButton) {
        confirmButton.textContent = confirmLabel;
    }

    return new Promise((resolve) => {
        const finish = (value: boolean) => {
            confirmButton?.removeEventListener('click', onAccept);
            cancelButton?.removeEventListener('click', onCancel);
            dialog.removeEventListener('cancel', onCancel);
            closeDialog(dialog);
            resolve(value);
        };

        const onAccept = () => finish(true);
        const onCancel = (event?: Event) => {
            event?.preventDefault();
            finish(false);
        };

        confirmButton?.addEventListener('click', onAccept);
        cancelButton?.addEventListener('click', onCancel);
        dialog.addEventListener('cancel', onCancel);

        openDialog(dialog);
        cancelButton?.focus();
    });
}

/**
 * Disable a button and swap its label while an async task runs.
 */
export async function withBusy<T>(
    button: HTMLButtonElement,
    busyLabel: string,
    task: () => Promise<T>,
): Promise<T> {
    const label =
        button.textContent;

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = busyLabel;

    try {
        return await task();
    } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = label;
    }
}

/**
 * Replace a table body with a single full-width message row.
 */
export function renderMessageRow(
    tbody: HTMLTableSectionElement,
    colspan: number,
    message: string,
    tone: 'muted' | 'error' = 'muted',
): void {
    tbody.replaceChildren(
        h(
            'tr',
            {},
            h(
                'td',
                {
                    colspan,
                    class: `px-6 py-6 text-center ${tone === 'error' ? 'text-red-300' : 'text-slate-400'}`,
                },
                message,
            ),
        ),
    );
}

/**
 * Show or hide an inline form error.
 */
export function setFormError(
    element: HTMLElement,
    message: string | null,
): void {
    element.textContent = message ?? '';
    element.classList.toggle('hidden', !message);
}
