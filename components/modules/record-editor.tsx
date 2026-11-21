'use client';
import { useState } from 'react';
import { useModuleOptions } from '@/hooks/use-module-options';
import { useRouter } from 'next/navigation';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ModuleName, ModuleDefinition } from '@/config/modules';
import { modules } from '@/config/modules';
import { modulesApi } from '@/lib/api/modules-client';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { hasPermissions } from '@/lib/auth/permissions';
function CompanyField({ current, allowed }: { current: unknown; allowed: boolean }) {
    const [query, setQuery] = useState('');
    const { t } = useLocale();
    const { rows: items, error, loading } = useModuleOptions('companies', query, allowed);
    return (
        <>
            <label className="form-label" htmlFor="company-search">
                {t('field.companyId')}
            </label>
            {allowed && <input id="company-search" className="form-input mb-2" placeholder={t('common.search')} value={query} onChange={(event) => setQuery(event.target.value)} />}
            <select name="companyId" aria-label={t('field.companyId')} className="form-input" defaultValue={typeof current === 'string' ? current : ''} disabled={!allowed}>
                <option value="">—</option>
                {typeof current === 'string' && !items.some((row) => row.id === current) && <option value={current}>Current company</option>}
                {items.map((row) => (
                    <option value={String(row.id)} key={String(row.id)}>
                        {String(row.name)}
                    </option>
                ))}
            </select>
            {loading && <p className="muted text-xs mt-2">{t('common.loading')}</p>}
            {error && (
                <p role="alert" className="login-error">
                    {error}
                </p>
            )}
            {!allowed && <p className="muted text-xs mt-2">Company catalog access is required to change this association.</p>}
        </>
    );
}
export default function RecordEditor({
    name,
    mode,
    record,
    permissions,
    close,
}: {
    name: ModuleName;
    mode: 'create' | 'edit' | 'delete';
    record?: Record<string, unknown>;
    permissions: string[];
    close: () => void;
}) {
    const definition: ModuleDefinition = modules[name];
    const { t } = useLocale();
    const notify = useNotifications();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const fields = definition.fields.filter((field) => (mode === 'create' ? !field.editOnly : !field.createOnly));
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
                            {t('common.' + (mode === 'create' ? 'create' : mode === 'delete' ? 'delete' : 'edit'))} · {t(definition.title)}
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
                                if (mode === 'delete') await modulesApi.remove(name, String(record?.id));
                                else {
                                    const body: Record<string, unknown> = {};
                                    for (const field of fields) {
                                        if (!data.has(field.key)) continue;
                                        const value = String(data.get(field.key) ?? '');
                                        body[field.key] = field.nullable && value === '' ? null : value;
                                    }
                                    if (mode === 'create') await modulesApi.create(name, body);
                                    else await modulesApi.update(name, String(record?.id), body);
                                }
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
                        {mode === 'delete' ? (
                            <p className="muted text-sm leading-7">
                                {name === 'users'
                                    ? 'Archive this user and revoke their sessions? The email address remains reserved.'
                                    : name === 'companies'
                                      ? 'Delete this company? Reassign its linked users before continuing.'
                                      : 'Delete this role and its direct mappings? Existing grant-scope protections still apply.'}
                            </p>
                        ) : (
                            fields.map((field) => (
                                <div className="editor-field" key={field.key}>
                                    {field.type === 'company' ? (
                                        <CompanyField current={record?.[field.key]} allowed={hasPermissions(permissions, ['companies.read'])} />
                                    ) : (
                                        <>
                                            <label className="form-label" htmlFor={'record-' + field.key}>
                                                {t('field.' + field.key, field.key)}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    id={'record-' + field.key}
                                                    className="form-input"
                                                    name={field.key}
                                                    maxLength={field.max}
                                                    defaultValue={String(record?.[field.key] ?? '')}
                                                    disabled={busy}
                                                />
                                            ) : (
                                                <input
                                                    id={'record-' + field.key}
                                                    name={field.key}
                                                    className="form-input"
                                                    type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
                                                    required={field.required}
                                                    maxLength={field.max}
                                                    minLength={field.type === 'password' ? 12 : undefined}
                                                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                                                    defaultValue={String(record?.[field.key] ?? '')}
                                                    disabled={busy}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                        {name === 'users' && mode === 'create' && <p className="muted text-xs leading-6">A verification email is queued. This does not grant administrative authority.</p>}
                        {name === 'permissions' && mode === 'create' && (
                            <p className="muted text-xs leading-6">Creating a definition grants no access. A trusted operator authorizes its first grant.</p>
                        )}
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
                                {busy ? t('common.loading') : t(mode === 'delete' ? 'common.delete' : 'common.save')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
