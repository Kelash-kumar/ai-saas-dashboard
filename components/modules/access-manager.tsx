'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/api/client';
import type { SessionView } from '@/lib/auth/types';
import type { UserAccess } from '@/lib/api/access-server';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
export function AccessManager({
    userId,
    email,
    authority,
    roles,
    catalog,
    actor,
}: {
    userId: string;
    email: string;
    authority: UserAccess;
    roles: Record<string, unknown>[];
    catalog: Record<string, unknown>[];
    actor: SessionView;
}) {
    const { t } = useLocale();
    const notify = useNotifications();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const change = async (kind: 'role' | 'permission', id: string, grant: boolean) => {
        setBusy(true);
        try {
            await http.post('/api/access/' + userId, { kind, id, grant });
            notify(t('common.success'));
            router.refresh();
        } catch (error) {
            notify(error instanceof Error ? error.message : 'Request failed.', 'error');
        } finally {
            setBusy(false);
        }
    };
    const can = (permission: string) => actor.permissions.includes(permission);
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">{email}</span>
                    <h1>{t('access.title')}</h1>
                </div>
            </div>
            <section className="panel mb-6">
                <h2 className="font-bold mb-4">{t('access.effective')}</h2>
                <div className="flex flex-wrap gap-2">
                    {authority.roles.map((role) => (
                        <span className="badge" key={role}>
                            {role}
                        </span>
                    ))}
                    {authority.permissions.map((permission) => (
                        <span className="badge badge-neutral" key={permission}>
                            {permission}
                        </span>
                    ))}
                </div>
                <p className="muted text-xs mt-4">{t('access.inherited')}</p>
            </section>
            <div className="ui-grid">
                {(['role', 'permission'] as const).map((kind) => {
                    const options = kind === 'role' ? roles : catalog;
                    const direct = kind === 'role' ? authority.directRoleIds : authority.directPermissionIds;
                    const allowed = kind === 'role' ? can('roles.assign') : can('permissions.assign');
                    const removable = kind === 'role' ? can('roles.assign') : can('permissions.revoke');
                    return (
                        <section className="panel" key={kind}>
                            <h2 className="font-bold mb-4">{t(kind === 'role' ? 'dashboard.roles' : 'dashboard.permissions')}</h2>
                            <ul className="grant-list">
                                {direct.map((id) => (
                                    <li key={id}>
                                        <span>{String(options.find((row) => row.id === id)?.name ?? t('access.direct'))}</span>
                                        {removable && options.some((row) => row.id === id) && (
                                            <button type="button" className="text-link danger-link" disabled={busy} onClick={() => void change(kind, id, false)}>
                                                {t('access.remove')}
                                            </button>
                                        )}
                                    </li>
                                ))}
                                {!direct.length && <li className="muted">—</li>}
                            </ul>
                            {allowed && options.length > 0 && (
                                <form
                                    className="mt-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const id = String(new FormData(event.currentTarget).get('id') ?? '');
                                        if (id) void change(kind, id, true);
                                    }}
                                >
                                    <label className="form-label" htmlFor={'assign-' + kind}>
                                        {t(kind === 'role' ? 'access.assignRole' : 'access.grantPermission')}
                                    </label>
                                    <select id={'assign-' + kind} name="id" required className="form-input">
                                        <option value="">—</option>
                                        {options
                                            .filter((row) => !direct.includes(String(row.id)))
                                            .filter((row) => (kind === 'permission' ? actor.permissions.includes(String(row.name)) : can('roles.delegate') || actor.roles.includes(String(row.name))))
                                            .map((row) => (
                                                <option key={String(row.id)} value={String(row.id)}>
                                                    {String(row.name)}
                                                </option>
                                            ))}
                                    </select>
                                    <button type="submit" className="btn btn-primary mt-3" disabled={busy}>
                                        {t('common.save')}
                                    </button>
                                </form>
                            )}
                        </section>
                    );
                })}
            </div>
        </>
    );
}
