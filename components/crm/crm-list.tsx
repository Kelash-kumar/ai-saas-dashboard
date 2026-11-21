'use client';
import { Icon } from '@/components/ui/icon';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import type { ModuleName, PageData } from '@/config/modules';
import { modules } from '@/config/modules';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { crmApi } from '@/lib/api/crm-client';
import { ConfirmAction } from './confirm-action';
import { CompanyPicker } from './company-picker';
export function CrmList({ name, page, permissions, query }: { name: Exclude<ModuleName, 'permissions'>; page: PageData; permissions: string[]; query: Record<string, string | undefined> }) {
    const router = useRouter(),
        { t, locale } = useLocale(),
        notify = useNotifications();
    const [filters, setFilters] = useState(false),
        [pending, startTransition] = useTransition(),
        [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    const [selected, setSelected] = useState<string[]>([]),
        [confirm, setConfirm] = useState<{ action: 'delete' | 'restore'; ids: string[] } | null>(null);
    const [company, setCompany] = useState(query.companyId ?? '');
    const can = (permission: string) => permissions.includes(name + '.' + permission);
    const account = name === 'users' || name === 'admins';
    const fields = modules[name].columns;
    const queryString = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]).toString();
    function navigate(changes: Record<string, string>) {
        const params = new URLSearchParams(queryString);
        for (const [key, value] of Object.entries(changes)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        startTransition(() => router.push('/' + name + (params.size ? '?' + params : '')));
    }
    async function download(format: 'csv' | 'xlsx') {
        setBusy(true);
        setError('');
        try {
            await crmApi.export(name, queryString, format);
            notify('Export downloaded.');
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : 'Export failed.';
            setError(message);
            notify(message, 'error');
        } finally {
            setBusy(false);
        }
    }
    const date = new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
    function cell(key: string, row: Record<string, unknown>) {
        const value = row[key];
        if (key === 'fullName')
            return (
                <span className="crm-person">
                    <span className="crm-avatar">
                        {typeof row.avatarData === 'string' ? (
                            <Image src={row.avatarData} alt="" width={42} height={42} unoptimized />
                        ) : (
                            <span aria-hidden="true">
                                {String(row.firstName ?? row.email ?? '?')
                                    .slice(0, 1)
                                    .toUpperCase()}
                            </span>
                        )}
                    </span>
                    <span>
                        {String(value ?? row.email ?? '—')}
                        {!!row.deletedAt && <small className="crm-deleted">Deleted</small>}
                    </span>
                </span>
            );
        if (key === 'notificationChannel' || key === 'twoFactor') return <span className={'crm-status ' + (value === 'email' ? 'enabled' : '')}>{value === 'email' ? 'Email' : 'Not Set'}</span>;
        if (key === 'createdAt' && typeof value === 'string') return date.format(new Date(value));
        return typeof value === 'string' ? value : '—';
    }
    const selectable = can('delete') || can('restore'),
        all = page.data.length > 0 && page.data.every((row) => selected.includes(String(row.id)));
    return (
        <>
            <div className="crm-breadcrumb">
                <Link href="/">
                    <Icon name="home" className="size-4" />
                    Dashboard
                </Link>
                <Icon name="caret" className="size-4 -rotate-90 rtl:rotate-90" />
                <span>{t(modules[name].title)}</span>
            </div>
            <section className="panel crm-list">
                <div className="crm-toolbar">
                    <div>
                        <button type="button" className="btn crm-soft" aria-expanded={filters} aria-controls="crm-filters" onClick={() => setFilters(!filters)}>
                            <Icon name="filter" className="size-4" />
                            {filters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <button
                            type="button"
                            className="btn crm-danger"
                            onClick={() => {
                                setCompany('');
                                startTransition(() => router.push('/' + name));
                            }}
                        >
                            <Icon name="close" className="size-4" />
                            Clear Filters
                        </button>
                    </div>
                    <div>
                        {can('delete') && (
                            <button type="button" className="btn crm-danger" disabled={!selected.length || busy} onClick={() => setConfirm({ action: 'delete', ids: selected })}>
                                <Icon name="trash" className="size-4" />
                                Delete{selected.length ? ' (' + selected.length + ')' : ''}
                            </button>
                        )}
                        {can('restore') && (query.deleted === 'only' || query.deleted === 'with') && (
                            <button className="btn btn-secondary" disabled={!selected.length || busy} onClick={() => setConfirm({ action: 'restore', ids: selected })}>
                                Restore
                            </button>
                        )}
                        {can('export') && (
                            <>
                                <button className="btn crm-export-csv" disabled={busy} onClick={() => download('csv')}>
                                    <Icon name="download" className="size-4" />
                                    Export CSV
                                </button>
                                <button className="btn crm-export-excel" disabled={busy} onClick={() => download('xlsx')}>
                                    <Icon name="download" className="size-4" />
                                    Export Excel
                                </button>
                            </>
                        )}
                        {can('create') && (
                            <Link className="btn btn-primary" href={'/' + name + '/create'}>
                                <Icon name="plus" className="size-4" />
                                Add New
                            </Link>
                        )}
                    </div>
                </div>
                {filters && (
                    <form
                        className="crm-filters"
                        id="crm-filters"
                        key={queryString}
                        onSubmit={(event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            navigate({
                                companyId: company,
                                fromDate: String(data.get('fromDate') ?? ''),
                                toDate: String(data.get('toDate') ?? ''),
                                deleted: String(data.get('deleted') ?? 'active'),
                                guard: String(data.get('guard') ?? ''),
                                page: '1',
                            });
                        }}
                    >
                        <div className="crm-filter-fields">
                            {account && (
                                <div>
                                    <label htmlFor="filter-company">Company</label>
                                    <CompanyPicker id="filter-company" value={company} change={setCompany} allowed={permissions.includes('companies.read')} />
                                </div>
                            )}
                            <div>
                                <label>Created Date Range</label>
                                <div className="crm-date-range">
                                    <input aria-label="From date" type="date" name="fromDate" className="form-input" defaultValue={query.fromDate} />
                                    <span>→</span>
                                    <input aria-label="To date" type="date" name="toDate" className="form-input" defaultValue={query.toDate} />
                                </div>
                            </div>
                            {name === 'roles' ? (
                                <div>
                                    <label htmlFor="filter-guard">Guard</label>
                                    <select className="form-input" id="filter-guard" name="guard" defaultValue={query.guard ?? ''}>
                                        <option value="">All guards</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="filter-deleted">Include Deleted</label>
                                    <select id="filter-deleted" name="deleted" className="form-input" defaultValue={query.deleted ?? 'active'}>
                                        <option value="active">Active records</option>
                                        <option value="with">Include deleted</option>
                                        <option value="only">Deleted only</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="crm-filter-footer">
                            <button className="btn btn-primary" disabled={pending}>
                                <Icon name="search" className="size-4" />
                                Apply Filters
                            </button>
                        </div>
                    </form>
                )}
                <div className="crm-search-row">
                    <h1 className="sr-only">{t(modules[name].title)}</h1>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate({ search: String(new FormData(e.currentTarget).get('search') ?? ''), page: '1' });
                        }}
                    >
                        <input className="form-input" name="search" aria-label="Search" placeholder="Search…" defaultValue={query.search ?? ''} maxLength={100} />
                        <button className="btn crm-soft" disabled={pending}>
                            Search
                        </button>
                    </form>
                </div>
                {error && (
                    <p role="alert" className="login-error">
                        {error}
                    </p>
                )}
                <div className="table-scroll">
                    <table className="crm-table">
                        <caption className="sr-only">{t(modules[name].title)}</caption>
                        <thead>
                            <tr>
                                {selectable && (
                                    <th>
                                        <input
                                            type="checkbox"
                                            aria-label="Select all records on this page"
                                            checked={all}
                                            ref={(element) => {
                                                if (element) element.indeterminate = selected.length > 0 && !all;
                                            }}
                                            onChange={() => setSelected(all ? [] : page.data.map((row) => String(row.id)))}
                                        />
                                    </th>
                                )}
                                <th>S.No</th>
                                {fields.map(([key, label, sort]) => (
                                    <th key={key}>
                                        {sort ? (
                                            <button type="button" onClick={() => navigate({ sortBy: sort, sortOrder: query.sortBy === sort && query.sortOrder === 'asc' ? 'desc' : 'asc', page: '1' })}>
                                                {label}
                                                <span className="crm-sort" aria-hidden="true">
                                                    <Icon
                                                        name={query.sortBy === sort ? 'caret' : 'carets'}
                                                        className={'size-4 ' + (query.sortBy === sort && query.sortOrder === 'asc' ? 'rotate-180' : '')}
                                                    />
                                                </span>
                                            </button>
                                        ) : (
                                            label
                                        )}
                                    </th>
                                ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {page.data.map((row, index) => (
                                <tr key={String(row.id)}>
                                    {selectable && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                aria-label={'Select ' + String(row.email ?? row.name)}
                                                checked={selected.includes(String(row.id))}
                                                onChange={() => setSelected((previous) => (previous.includes(String(row.id)) ? previous.filter((id) => id !== row.id) : [...previous, String(row.id)]))}
                                            />
                                        </td>
                                    )}
                                    <td>{(page.meta.page - 1) * page.meta.limit + index + 1}</td>
                                    {fields.map(([key]) => (
                                        <td key={key}>{cell(key, row)}</td>
                                    ))}
                                    <td>
                                        <Menu>
                                            <MenuButton className="icon-button crm-actions" aria-label={'Actions for ' + String(row.email ?? row.name)}>
                                                <Icon name="dots" className="size-5" />
                                            </MenuButton>
                                            <MenuItems anchor="bottom end" className="crm-action-menu">
                                                <MenuItem>
                                                    <Link href={'/' + name + '/' + row.id}>View</Link>
                                                </MenuItem>
                                                {can('update') && !row.deletedAt && (
                                                    <MenuItem>
                                                        <Link href={'/' + name + '/' + row.id + '/edit'}>Edit</Link>
                                                    </MenuItem>
                                                )}
                                                {name === 'users' && permissions.includes('users.read') && !row.deletedAt && (
                                                    <MenuItem>
                                                        <Link href={'/users/' + row.id + '/access'}>Manage access</Link>
                                                    </MenuItem>
                                                )}
                                                {can('delete') && !row.deletedAt && (
                                                    <MenuItem>
                                                        <button onClick={() => setConfirm({ action: 'delete', ids: [String(row.id)] })}>Delete</button>
                                                    </MenuItem>
                                                )}
                                                {can('restore') && !!row.deletedAt && (
                                                    <MenuItem>
                                                        <button onClick={() => setConfirm({ action: 'restore', ids: [String(row.id)] })}>Restore</button>
                                                    </MenuItem>
                                                )}
                                            </MenuItems>
                                        </Menu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!page.data.length && <p className="crm-empty">No records found.</p>}
                </div>
                <div className="crm-pagination">
                    <div>
                        Showing {page.meta.total ? (page.meta.page - 1) * page.meta.limit + 1 : 0} to {Math.min(page.meta.page * page.meta.limit, page.meta.total)} of {page.meta.total} entries{' '}
                        <select className="form-input" aria-label="Rows per page" value={String(page.meta.limit)} onChange={(e) => navigate({ limit: e.target.value, page: '1' })}>
                            {[10, 20, 25, 50, 100].map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <nav aria-label="Pagination">
                        <button aria-label="First page" disabled={pending || !page.meta.hasPreviousPage} onClick={() => navigate({ page: '1' })}>
                            <Icon name="carets" className="size-4 rotate-90 rtl:-rotate-90" />
                        </button>
                        <button aria-label="Previous page" disabled={pending || !page.meta.hasPreviousPage} onClick={() => navigate({ page: String(page.meta.page - 1) })}>
                            <Icon name="caret" className="size-4 rotate-90 rtl:-rotate-90" />
                        </button>
                        <span>{page.meta.page}</span>
                        <button aria-label="Next page" disabled={pending || !page.meta.hasNextPage} onClick={() => navigate({ page: String(page.meta.page + 1) })}>
                            <Icon name="caret" className="size-4 -rotate-90 rtl:rotate-90" />
                        </button>
                        <button aria-label="Last page" disabled={pending || !page.meta.hasNextPage} onClick={() => navigate({ page: String(page.meta.totalPages) })}>
                            <Icon name="carets" className="size-4 -rotate-90 rtl:rotate-90" />
                        </button>
                    </nav>
                </div>
            </section>
            {confirm && (
                <ConfirmAction
                    action={confirm.action}
                    count={confirm.ids.length}
                    busy={busy}
                    error={error}
                    close={() => {
                        setConfirm(null);
                        setError('');
                    }}
                    confirm={async () => {
                        setBusy(true);
                        setError('');
                        try {
                            await crmApi.bulk(name, confirm.ids, confirm.action);
                            setConfirm(null);
                            setSelected([]);
                            notify('Records updated.');
                            router.refresh();
                        } catch (reason) {
                            setError(reason instanceof Error ? reason.message : 'Request failed.');
                        } finally {
                            setBusy(false);
                        }
                    }}
                />
            )}
        </>
    );
}
