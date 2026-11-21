'use client';
import { http } from '@/lib/api/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
export default function CreatePermission({ close }: { close: () => void }) {
    const { t } = useLocale();
    const notify = useNotifications();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
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
                <DialogPanel className="record-editor panel">
                    <div className="editor-heading">
                        <DialogTitle>
                            {t('common.create')} · {t('nav.permissions')}
                        </DialogTitle>
                        <button type="button" className="icon-button" disabled={busy} aria-label={t('common.cancel')} onClick={close}>
                            ×
                        </button>
                    </div>
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            if (busy) return;
                            const data = new FormData(event.currentTarget);
                            setBusy(true);
                            setError('');
                            try {
                                await http.post('/api/modules/permissions', { resource: data.get('resource'), action: data.get('action') });
                                notify(t('common.success'));
                                close();
                                router.refresh();
                            } catch (reason) {
                                const message = reason instanceof Error ? reason.message : 'Request failed.';
                                setError(message);
                                notify(message, 'error');
                                setBusy(false);
                            }
                        }}
                    >
                        {(['resource', 'action'] as const).map((field) => (
                            <div className="editor-field" key={field}>
                                <label className="form-label" htmlFor={'record-' + field}>
                                    {t('field.' + field, field)}
                                </label>
                                <input className="form-input" id={'record-' + field} name={field} required maxLength={80} autoComplete="off" disabled={busy} />
                            </div>
                        ))}
                        <p className="muted text-xs leading-6">Creating a definition grants no access. A trusted operator authorizes its first grant.</p>
                        {error && (
                            <p role="alert" className="login-error mt-4">
                                {error}
                            </p>
                        )}
                        <div className="editor-footer">
                            <button type="button" className="btn btn-secondary" onClick={close} disabled={busy}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={busy}>
                                {busy ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
