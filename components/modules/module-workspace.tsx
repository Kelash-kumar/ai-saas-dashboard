'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import type { ModuleName, ModuleDefinition, PageData } from '@/config/modules';
import { modules } from '@/config/modules';
import { hasPermissions } from '@/lib/auth/permissions';
import { useLocale } from '@/components/providers/locale-provider';
const Editor = dynamic(() => import('./record-editor'), {
    loading: () => (
        <p role="status" className="muted">
            Loading form…
        </p>
    ),
});
export function ModuleWorkspace({ name, page, permissions, query }: { name: ModuleName; page: PageData; permissions: string[]; query: Record<string, string | undefined> }) {
    const definition: ModuleDefinition = modules[name];
    const { t, locale } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const [editor, setEditor] = useState<{ mode: 'create' | 'edit' | 'delete'; record?: Record<string, unknown> } | null>(null);
    const can = (required?: string[]) => !!required && hasPermissions(permissions, required);
    function address(changes: Record<string, string>) {
        const params = new URLSearchParams(Object.fromEntries(Object.entries(query).filter(([, value]) => typeof value === 'string') as [string, string][]));
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        return pathname + '?' + params.toString();
    }
    const dateFormatter = new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
    function cell(key: string, value: unknown) {
        if (value === null || value === undefined || value === '') return '—';
        if (key.endsWith('At') && typeof value === 'string') {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
        }
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '—';
    }
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">{t('nav.workspace')}</span>
                    <h1>{t(definition.title)}</h1>
                    <p>
                        {t('common.total')}: {page.meta.total}
                    </p>
                </div>
                {can(definition.create) && (
                    <button type="button" className="btn btn-primary" onClick={() => setEditor({ mode: 'create' })}>
                        {t('common.create')}
                    </button>
                )}
            </div>
            <section className="panel module-panel">
                <form
                    className="module-toolbar"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        startTransition(() => router.push(address({ search: String(data.get('search') ?? ''), page: '1' })));
                    }}
                >
                    <label className="sr-only" htmlFor="module-search">
                        {t('common.search')}
                    </label>
                    <input key={query.search ?? ''} id="module-search" name="search" className="form-input" placeholder={t('common.search')} defaultValue={query.search ?? ''} maxLength={100} />
                    <button className="btn btn-secondary" type="submit" disabled={pending}>
                        {pending ? t('common.loading') : t('common.search')}
                    </button>
                    <select
                        className="form-input module-sort"
                        aria-label="Sort by"
                        value={query.sortBy ?? 'createdAt'}
                        onChange={(event) => startTransition(() => router.push(address({ sortBy: event.target.value, page: '1' })))}
                    >
                        {definition.sort.map((field) => (
                            <option key={field} value={field}>
                                {t('field.' + field, field)}
                            </option>
                        ))}
                    </select>
                </form>
                <div className="table-scroll">
                    <table>
                        <caption className="sr-only">{t(definition.title)}</caption>
                        <thead>
                            <tr>
                                {definition.columns.map((column) => (
                                    <th key={column}>{t('field.' + column, column)}</th>
                                ))}
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {page.data.map((record) => (
                                <tr key={String(record.id)}>
                                    {definition.columns.map((column) => (
                                        <td key={column}>{column === 'status' ? <span className="badge badge-neutral">{cell(column, record[column])}</span> : cell(column, record[column])}</td>
                                    ))}
                                    <td>
                                        <div className="row-actions">
                                            {can(definition.update) && (
                                                <button type="button" className="text-link" onClick={() => setEditor({ mode: 'edit', record })}>
                                                    {t('common.edit')}
                                                </button>
                                            )}
                                            {can(definition.remove) && (
                                                <button type="button" className="text-link danger-link" onClick={() => setEditor({ mode: 'delete', record })}>
                                                    {t('common.delete')}
                                                </button>
                                            )}
                                            {name === 'users' && (
                                                <Link className="text-link" href={'/users/' + String(record.id) + '/access'}>
                                                    {t('common.access')}
                                                </Link>
                                            )}
                                            {!can(definition.update) && !can(definition.remove) && name !== 'users' && <span className="muted">—</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!page.data.length && <div className="module-empty">{t('common.empty')}</div>}
                <div className="pagination">
                    <span>
                        {page.meta.page} / {Math.max(page.meta.totalPages, 1)}
                    </span>
                    <div>
                        {page.meta.hasPreviousPage ? (
                            <Link className="btn btn-secondary" href={address({ page: String(page.meta.page - 1) })}>
                                {t('common.previous')}
                            </Link>
                        ) : (
                            <button type="button" className="btn btn-secondary" disabled>
                                {t('common.previous')}
                            </button>
                        )}
                        {page.meta.hasNextPage ? (
                            <Link className="btn btn-secondary" href={address({ page: String(page.meta.page + 1) })}>
                                {t('common.next')}
                            </Link>
                        ) : (
                            <button type="button" className="btn btn-secondary" disabled>
                                {t('common.next')}
                            </button>
                        )}
                    </div>
                </div>
            </section>
            {editor && <Editor name={name} mode={editor.mode} record={editor.record} permissions={permissions} close={() => setEditor(null)} />}
        </>
    );
}
