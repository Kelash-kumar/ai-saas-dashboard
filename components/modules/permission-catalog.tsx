'use client';
import { useState, useTransition } from 'react';
import { useGlobalLoadingEffect } from '@/hooks/use-global-loader';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import type { PageData } from '@/config/modules';
import { modules } from '@/config/modules';
import { hasPermissions } from '@/lib/auth/permissions';
import { useLocale } from '@/components/providers/locale-provider';
const columns = ['name', 'resource', 'action', 'createdAt'];
const Editor = dynamic(() => import('./create-permission'), {
    loading: () => (
        <p role="status" className="muted">
            Loading form…
        </p>
    ),
});
export function PermissionCatalog({ page, permissions, query }: { page: PageData; permissions: string[]; query: Record<string, string | undefined> }) {
    const definition = modules.permissions;
    const { t, locale } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    useGlobalLoadingEffect(pending);
    const [editor, setEditor] = useState(false);
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
                {hasPermissions(permissions, definition.create) && (
                    <button type="button" className="btn btn-primary" onClick={() => setEditor(true)}>
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
                        {['name', 'createdAt'].map((field) => (
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
                                {columns.map((column) => (
                                    <th key={column}>{t('field.' + column, column)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {page.data.map((record) => (
                                <tr key={String(record.id)}>
                                    {columns.map((column) => (
                                        <td key={column}>{cell(column, record[column])}</td>
                                    ))}
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
            {editor && <Editor close={() => setEditor(false)} />}
        </>
    );
}
