// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    closeDialog,
    confirmAction,
    openDialog,
    renderMessageRow,
    setFormError,
    showToast,
    withBusy,
} from '../../src/lib/admin/ui';

beforeEach(() => {
    document.body.innerHTML = `
        <div id="toastRegion"></div>
        <dialog id="confirmDialog">
            <p data-confirm-message></p>
            <button data-confirm-cancel>Cancel</button>
            <button data-confirm-accept>Delete</button>
        </dialog>`;
});

describe('toasts', () => {
    it('shows tone-specific toasts that expire', () => {
        vi.useFakeTimers();

        const error = showToast('Nope', 'error', document, 100)!;
        const info = showToast('Hi')!;

        expect(error.getAttribute('role')).toBe('alert');
        expect(info.getAttribute('role')).toBe('status');
        expect(info.dataset.tone).toBe('info');

        vi.advanceTimersByTime(100);
        expect(error.isConnected).toBe(false);
        expect(info.isConnected).toBe(true);

        vi.useRealTimers();
    });

    it('returns null without a region', () => {
        document.body.innerHTML = '';
        expect(showToast('x')).toBeNull();
    });
});

describe('dialogs', () => {
    it('opens and closes with and without native support', () => {
        const dialog = document.getElementById('confirmDialog') as HTMLDialogElement;

        openDialog(dialog);
        expect(dialog.open).toBe(true);
        openDialog(dialog);
        closeDialog(dialog);
        expect(dialog.open).toBe(false);

        const legacy = document.createElement('div') as unknown as HTMLDialogElement;
        openDialog(legacy);
        expect(legacy.hasAttribute('open')).toBe(true);
        closeDialog(legacy);
        expect(legacy.hasAttribute('open')).toBe(false);
    });

    it('confirmAction resolves with the user choice', async () => {
        const dialog = document.getElementById('confirmDialog') as HTMLDialogElement;

        const accepted = confirmAction('Really?', 'Remove');
        expect(dialog.querySelector('[data-confirm-message]')!.textContent).toBe('Really?');
        expect(dialog.querySelector('[data-confirm-accept]')!.textContent).toBe('Remove');
        dialog.querySelector<HTMLButtonElement>('[data-confirm-accept]')!.click();
        expect(await accepted).toBe(true);

        const cancelled = confirmAction('Really?');
        dialog.querySelector<HTMLButtonElement>('[data-confirm-cancel]')!.click();
        expect(await cancelled).toBe(false);

        const escaped = confirmAction('Really?');
        dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(await escaped).toBe(false);
    });

    it('confirmAction resolves false without the dialog and tolerates partial markup', async () => {
        document.body.innerHTML = '';
        expect(await confirmAction('x')).toBe(false);

        document.body.innerHTML = '<dialog id="confirmDialog"></dialog>';
        const pending = confirmAction('x');
        document.getElementById('confirmDialog')!.dispatchEvent(new Event('cancel'));
        expect(await pending).toBe(false);
    });
});

describe('form helpers', () => {
    it('withBusy disables the button and restores it even on failure', async () => {
        const button = document.createElement('button');
        button.textContent = 'Save';

        const result = withBusy(button, 'Saving…', async () => {
            expect(button.disabled).toBe(true);
            expect(button.textContent).toBe('Saving…');
            return 7;
        });

        expect(await result).toBe(7);
        expect(button.disabled).toBe(false);
        expect(button.textContent).toBe('Save');

        await expect(withBusy(button, '…', async () => { throw new Error('x'); })).rejects.toThrow('x');
        expect(button.hasAttribute('aria-busy')).toBe(false);
    });

    it('renders message rows and form errors', () => {
        const tbody = document.createElement('tbody');

        renderMessageRow(tbody, 3, 'Failed', 'error');
        expect(tbody.querySelector('td')!.className).toContain('text-red-300');

        const box = document.createElement('div');
        setFormError(box, 'Bad');
        expect(box.classList.contains('hidden')).toBe(false);
        setFormError(box, null);
        expect(box.textContent).toBe('');
        expect(box.classList.contains('hidden')).toBe(true);
    });
});
