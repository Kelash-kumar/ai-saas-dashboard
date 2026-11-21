'use client';
import { Icon } from '@/components/ui/icon';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
export function ConfirmAction({ action, count, busy, error, close, confirm }: { action: 'delete' | 'restore'; count: number; busy: boolean; error: string; close: () => void; confirm: () => void }) {
    return (
        <Dialog
            open
            onClose={() => {
                if (!busy) close();
            }}
            className="fixed inset-0 z-70"
        >
            <DialogBackdrop className="dialog-backdrop" />
            <div className="editor-viewport">
                <DialogPanel className="panel record-editor">
                    <DialogTitle className="text-xl font-bold">
                        {action === 'delete' ? 'Delete' : 'Restore'} {count} record{count === 1 ? '' : 's'}?
                    </DialogTitle>
                    <p className="muted mt-4 leading-7">
                        {action === 'delete'
                            ? 'Accounts and companies are archived; roles are permanently deleted. Account sessions are revoked. The whole selection is processed together.'
                            : 'Restore the selected records? Previous sessions stay signed out. Existing verification and security restrictions still apply.'}
                    </p>
                    {error && (
                        <p role="alert" className="login-error mt-4">
                            {error}
                        </p>
                    )}
                    <div className="editor-footer">
                        <button className="btn btn-secondary" onClick={close} disabled={busy}>
                            Cancel
                        </button>
                        <button className={'btn ' + (action === 'delete' ? 'crm-danger' : 'btn-primary')} onClick={confirm} disabled={busy}>
                            <Icon name={action === 'delete' ? 'trash' : 'reset'} className="size-4" />
                            {busy ? 'Processing…' : action === 'delete' ? 'Delete' : 'Restore'}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
