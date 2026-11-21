'use client';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ModuleName } from '@/config/modules';
import { modules } from '@/config/modules';
import type { SessionView } from '@/lib/auth/types';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { crmApi } from '@/lib/api/crm-client';
import { CompanyPicker } from './company-picker';
import { GrantPicker } from './grant-picker';
import { PermissionMatrix } from './permission-matrix';
import { ConfirmAction } from './confirm-action';
const singular = { admins: 'Admin', users: 'User', roles: 'Role', companies: 'Company', permissions: 'Permission' };
const textFields = {
    accounts: [
        ['firstName', 'First Name', 100],
        ['lastName', 'Last Name', 100],
        ['username', 'Username', 80],
        ['email', 'Email', 320],
        ['phone', 'Phone', 30],
    ],
    companies: [
        ['name', 'Name', 160],
        ['email', 'Email', 320],
        ['phone', 'Phone', 30],
        ['website', 'Website', 500],
        ['address', 'Address', 2000],
    ],
} as const;
export function CrmEditor({
    name,
    mode,
    record = {},
    roles,
    permissions,
    actor,
}: {
    name: ModuleName;
    mode: 'create' | 'edit' | 'view';
    record?: Record<string, unknown>;
    roles: Record<string, unknown>[];
    permissions: Record<string, unknown>[];
    actor: SessionView;
}) {
    const router = useRouter(),
        { t } = useLocale(),
        notify = useNotifications();
    const account = name === 'admins' || name === 'users',
        readOnly = mode === 'view' || !!record.deletedAt;
    const [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [company, setCompany] = useState(String(record.companyId ?? '')),
        [guard, setGuard] = useState(String(record.guard ?? '')),
        [avatar, setAvatar] = useState(String(record.avatarData ?? ''));
    const [maxDob] = useState(() => new Date(Date.now() - 86400000).toISOString().slice(0, 10));
    const [roleIds, setRoleIds] = useState<string[]>((record.roleIds as string[]) ?? []);
    const canRoles = actor.permissions.includes('roles.assign') && actor.permissions.includes('roles.read');
    const canPermissions = actor.permissions.includes('permissions.assign') && actor.permissions.includes('permissions.revoke') && actor.permissions.includes('permissions.read');
    const [permissionIds, setPermissionIds] = useState<string[]>(
        (record.permissionIds as string[]) ?? (name === 'admins' && canPermissions ? permissions.filter((row) => row.name === 'admin.access').map((row) => String(row.id)) : []),
    );
    const [confirm, setConfirm] = useState<'delete' | 'restore' | null>(null);
    const title = (mode === 'create' ? 'Create ' : mode === 'edit' ? 'Edit ' : 'View ') + singular[name];
    const id = typeof record.id === 'string' ? record.id : undefined;
    const formId = 'crm-record';
    const accountGuard = name === 'admins' ? 'admin' : 'user';
    async function upload(file?: File) {
        if (!file) return;
        try {
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5_000_000) throw Error('Choose a PNG, JPEG or WebP image under 5MB.');
            const image = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            if (!context) throw Error('Image processing is unavailable.');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, 64, 64);
            const scale = Math.max(64 / image.width, 64 / image.height);
            context.drawImage(image, (64 - image.width * scale) / 2, (64 - image.height * scale) / 2, image.width * scale, image.height * scale);
            image.close();
            const result = canvas.toDataURL('image/jpeg', 0.72);
            if (result.length > 8000) throw Error('Image is too complex. Choose a simpler avatar.');
            setAvatar(result);
            setError('');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Image could not be loaded.');
        }
    }
    return (
        <>
            <div className="crm-breadcrumb">
                <Link href="/">
                    <Icon name="home" className="size-4" />
                    Dashboard
                </Link>
                <Icon name="caret" className="size-4 -rotate-90 rtl:rotate-90" />
                <Link href={'/' + name}>{t(modules[name].title)}</Link>
                <Icon name="caret" className="size-4 -rotate-90 rtl:rotate-90" />
                <span>{title}</span>
                {id && <small>#{id.slice(0, 8)}…</small>}
            </div>
            <div className="crm-page-heading">
                <div>
                    <span className="crm-heading-icon">
                        <Icon name={name === 'admins' ? 'admin' : account ? 'user' : name === 'roles' ? 'roles' : 'company'} className="size-6" />
                    </span>
                    <div>
                        <h1>{title}</h1>
                        <p>
                            {mode === 'create'
                                ? 'Add a new ' + singular[name].toLowerCase() + ' to the system'
                                : mode === 'view'
                                  ? 'Record information'
                                  : 'Update ' + singular[name].toLowerCase() + ' information'}
                        </p>
                    </div>
                </div>
                <div className="crm-heading-actions">
                    {id && mode === 'edit' && (
                        <Link className="btn crm-view" href={'/' + name + '/' + id}>
                            <Icon name="view" className="size-4" />
                            View
                        </Link>
                    )}
                    {id && mode === 'view' && !record.deletedAt && actor.permissions.includes(name + '.update') && (
                        <Link className="btn crm-view" href={'/' + name + '/' + id + '/edit'}>
                            Edit
                        </Link>
                    )}
                    {account && id && !record.deletedAt && record.status === 'active' && !record.emailVerifiedAt && !record.accessApprovedAt && actor.permissions.includes(name + '.update') && (
                        <button
                            type="button"
                            className="btn crm-view"
                            disabled={busy}
                            onClick={async () => {
                                setBusy(true);
                                setError('');
                                try {
                                    await crmApi.save(name, { allowLogin: true }, id);
                                    notify('Login enabled. Share the account email and password.');
                                    router.refresh();
                                } catch (reason) {
                                    setError(reason instanceof Error ? reason.message : 'Unable to enable login.');
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        >
                            Enable Login
                        </button>
                    )}
                    {id && actor.permissions.includes(name + (record.deletedAt ? '.restore' : '.delete')) && (
                        <button className="btn crm-danger" onClick={() => setConfirm(record.deletedAt ? 'restore' : 'delete')}>
                            <Icon name={record.deletedAt ? 'reset' : 'trash'} className="size-4" />
                            {record.deletedAt ? 'Restore' : 'Delete'}
                        </button>
                    )}
                    <Link className="btn btn-secondary" href={'/' + name}>
                        <Icon name="back" className="size-4" />
                        Back to List
                    </Link>
                    {!readOnly && (
                        <button form={formId} type="submit" className="btn btn-primary" disabled={busy}>
                            <Icon name="confirm" className="size-4" />
                            {busy ? 'Saving…' : mode === 'create' ? 'Create Record' : 'Update Record'}
                        </button>
                    )}
                </div>
            </div>
            <form
                id={formId}
                className={'panel crm-record ' + (account ? 'crm-account-record' : '')}
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (busy || readOnly) return;
                    const data = new FormData(event.currentTarget);
                    setBusy(true);
                    setError('');
                    try {
                        const body: Record<string, unknown> = {};
                        if (account) {
                            for (const [key] of textFields.accounts) if (key !== 'email' || mode === 'create') body[key] = String(data.get(key) ?? '') || null;
                            body.dateOfBirth = String(data.get('dateOfBirth') ?? '') || null;
                            body.gender = String(data.get('gender') ?? '') || null;
                            body.notificationChannel = String(data.get('notificationChannel') ?? 'none');
                            body.twoFactor = String(data.get('twoFactor') ?? 'none');
                            body.avatarData = avatar || null;
                            if (actor.permissions.includes('companies.read')) body.companyId = company || null;
                            if (canRoles) body.roleIds = roleIds;
                            if (canPermissions) body.permissionIds = permissionIds;
                            if (mode === 'create') {
                                body.password = String(data.get('password'));
                                body.confirmPassword = String(data.get('confirmPassword'));
                                if (body.password !== body.confirmPassword) throw Error('Passwords do not match.');
                            }
                        } else if (name === 'roles') {
                            body.name = String(data.get('name'));
                            body.guard = guard;
                            body.description = String(data.get('description') ?? '');
                            if (canPermissions) body.permissionIds = permissionIds;
                        } else {
                            for (const [key] of textFields.companies) body[key] = String(data.get(key) ?? '') || (key === 'name' ? '' : null);
                        }
                        const result = await crmApi.save(name, body, id);
                        notify('Record saved.');
                        router.push('/' + name + '/' + result.data.id);
                        router.refresh();
                    } catch (reason) {
                        setError(reason instanceof Error ? reason.message : 'Request failed.');
                        setBusy(false);
                    }
                }}
            >
                {account && (
                    <aside className="crm-avatar-column">
                        <div className="crm-profile-avatar">{avatar ? <Image src={avatar} alt="Profile avatar" width={136} height={136} unoptimized /> : <Icon name="user" className="size-28" />}</div>
                        {!readOnly && (
                            <>
                                <label className="btn crm-soft crm-upload">
                                    Choose photo
                                    <input
                                        className="sr-only"
                                        aria-label="Choose profile photo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(event) => upload(event.target.files?.[0])}
                                    />
                                </label>
                                {avatar && (
                                    <button type="button" className="text-sm muted" onClick={() => setAvatar('')}>
                                        Remove photo
                                    </button>
                                )}
                                <small className="muted">Cropped to 64 × 64</small>
                            </>
                        )}
                    </aside>
                )}
                <div className="crm-record-fields">
                    <div className="crm-form-grid">
                        {account ? (
                            <>
                                {textFields.accounts.map(([key, label, max]) => (
                                    <div className="crm-field" key={key}>
                                        <label htmlFor={'crm-' + key}>
                                            {label}
                                            {['firstName', 'lastName', 'email'].includes(key) && <span aria-hidden="true"> *</span>}
                                        </label>
                                        <input
                                            className="form-input"
                                            id={'crm-' + key}
                                            name={key}
                                            type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                                            autoComplete="off"
                                            required={['firstName', 'lastName', 'email'].includes(key)}
                                            readOnly={readOnly || (key === 'email' && mode !== 'create')}
                                            maxLength={max}
                                            defaultValue={String(record[key] ?? '')}
                                            placeholder={'Enter ' + label.toLowerCase()}
                                        />
                                    </div>
                                ))}
                                <div className="crm-field">
                                    <label htmlFor="crm-dob">Date of Birth</label>
                                    <input className="form-input" id="crm-dob" name="dateOfBirth" type="date" max={maxDob} defaultValue={String(record.dateOfBirth ?? '')} readOnly={readOnly} />
                                </div>
                                <div className="crm-field">
                                    <label htmlFor="crm-gender">Gender</label>
                                    <select className="form-input" id="crm-gender" name="gender" defaultValue={String(record.gender ?? '')} disabled={readOnly}>
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                </div>
                                <div className="crm-field">
                                    <label htmlFor="record-company">Company</label>
                                    <CompanyPicker id="record-company" value={company} change={setCompany} allowed={!readOnly && actor.permissions.includes('companies.read')} />
                                </div>
                                <div className="crm-field">
                                    <label>Roles</label>
                                    <GrantPicker
                                        label="Roles"
                                        value={roleIds}
                                        change={setRoleIds}
                                        disabled={readOnly || !canRoles}
                                        rows={roles.filter((row) => row.guard === accountGuard && (actor.permissions.includes('roles.delegate') || actor.roles.includes(String(row.name))))}
                                    />
                                </div>
                                <div className="crm-field">
                                    <label>Direct Permissions</label>
                                    <GrantPicker
                                        label="Direct permissions"
                                        value={permissionIds}
                                        change={setPermissionIds}
                                        disabled={readOnly || !canPermissions}
                                        rows={permissions.filter((row) => actor.permissions.includes(String(row.name)))}
                                    />
                                </div>
                                {mode === 'create' && (
                                    <>
                                        <div className="crm-field">
                                            <label htmlFor="crm-password">
                                                Password <span aria-hidden="true">*</span>
                                            </label>
                                            <input
                                                className="form-input"
                                                id="crm-password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                                minLength={15}
                                                maxLength={128}
                                                required
                                                placeholder="Enter password"
                                            />
                                        </div>
                                        <div className="crm-field">
                                            <label htmlFor="crm-confirm">
                                                Confirm Password <span aria-hidden="true">*</span>
                                            </label>
                                            <input
                                                className="form-input"
                                                id="crm-confirm"
                                                name="confirmPassword"
                                                type="password"
                                                autoComplete="new-password"
                                                minLength={15}
                                                maxLength={128}
                                                required
                                                placeholder="Confirm password"
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="crm-field">
                                    <label htmlFor="crm-notification">Notification</label>
                                    <select className="form-input" id="crm-notification" name="notificationChannel" defaultValue={String(record.notificationChannel ?? 'none')} disabled={readOnly}>
                                        <option value="none">Not Set</option>
                                        <option value="email">Email</option>
                                        <option disabled>SMS — not configured</option>
                                    </select>
                                </div>
                                <div className="crm-field">
                                    <label htmlFor="crm-twofactor">Two-Factor</label>
                                    <select className="form-input" id="crm-twofactor" name="twoFactor" defaultValue={String(record.twoFactor ?? 'none')} disabled={readOnly}>
                                        <option value="none">Not Set</option>
                                        <option value="email">Email verification code</option>
                                        <option disabled>SMS — not configured</option>
                                    </select>
                                </div>
                            </>
                        ) : name === 'roles' ? (
                            <>
                                <div className="crm-field">
                                    <label htmlFor="crm-name">
                                        Name <span aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="crm-name"
                                        name="name"
                                        className="form-input"
                                        required
                                        maxLength={80}
                                        pattern="[a-z][a-z0-9_-]{0,79}"
                                        defaultValue={String(record.name ?? '')}
                                        readOnly={readOnly}
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="crm-field">
                                    <label htmlFor="crm-guard">
                                        Guard <span aria-hidden="true">*</span>
                                    </label>
                                    <select className="form-input" id="crm-guard" required value={guard} onChange={(event) => setGuard(event.target.value)} disabled={readOnly}>
                                        <option value="">Select guard</option>
                                        <option value="admin">Admin</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                                <div className="crm-field crm-wide">
                                    <label htmlFor="crm-description">Description</label>
                                    <textarea className="form-input" id="crm-description" name="description" maxLength={255} defaultValue={String(record.description ?? '')} readOnly={readOnly} />
                                </div>
                            </>
                        ) : (
                            textFields.companies.map(([key, label, max]) => (
                                <div key={key} className={'crm-field ' + (key === 'address' ? 'crm-wide' : '')}>
                                    <label htmlFor={'crm-' + key}>
                                        {label}
                                        {key === 'name' && <span aria-hidden="true"> *</span>}
                                    </label>
                                    {key === 'address' ? (
                                        <textarea className="form-input" name={key} id={'crm-' + key} maxLength={max} defaultValue={String(record[key] ?? '')} readOnly={readOnly} />
                                    ) : (
                                        <input
                                            id={'crm-' + key}
                                            name={key}
                                            className="form-input"
                                            type={key === 'email' ? 'email' : key === 'website' ? 'url' : 'text'}
                                            required={key === 'name'}
                                            maxLength={max}
                                            defaultValue={String(record[key] ?? '')}
                                            readOnly={readOnly}
                                            placeholder={'Enter ' + label.toLowerCase()}
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {name === 'roles' && guard && (
                        <PermissionMatrix
                            rows={permissions}
                            value={permissionIds}
                            change={setPermissionIds}
                            disabled={readOnly || !canPermissions}
                            allowed={actor.permissions}
                            inherited={((record.permissions as string[]) ?? []).filter((permission) => !permissions.some((row) => row.name === permission && permissionIds.includes(String(row.id))))}
                        />
                    )}
                    {account && (
                        <p className="crm-form-note">
                            Managed accounts can sign in immediately using their email and initial password. User records use Login as User. Admin login additionally requires admin.access. Email
                            two-factor, when enabled, still requires its code. Email verification remains separate from admin approval.
                        </p>
                    )}
                    {record.deletedAt ? <p className="login-error">This record is archived. Restore it before editing.</p> : null}
                    {error && (
                        <p role="alert" className="login-error mt-6">
                            {error}
                        </p>
                    )}
                </div>
            </form>
            {confirm && id && (
                <ConfirmAction
                    action={confirm}
                    count={1}
                    busy={busy}
                    error={error}
                    close={() => {
                        setConfirm(null);
                        setError('');
                    }}
                    confirm={async () => {
                        setBusy(true);
                        try {
                            await crmApi.bulk(name, [id], confirm);
                            notify('Record updated.');
                            router.push('/' + name);
                            router.refresh();
                        } catch (reason) {
                            setError(reason instanceof Error ? reason.message : 'Request failed.');
                            setBusy(false);
                        }
                    }}
                />
            )}
        </>
    );
}
