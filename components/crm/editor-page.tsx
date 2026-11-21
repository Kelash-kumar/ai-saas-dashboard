import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/server';
import { moduleDefinition } from '@/config/modules';
import type { ModuleName } from '@/config/modules';
import { hasPermissions } from '@/lib/auth/permissions';
import { findCrm, catalog } from '@/lib/api/crm-server';
import { CrmEditor } from './crm-editor';
export async function EditorPage({ module, id, mode }: { module: string; id?: string; mode: 'create' | 'edit' | 'view' }) {
    const definition = moduleDefinition(module);
    if (!definition || module === 'permissions') notFound();
    const actor = await requireSession(),
        required = mode === 'create' ? definition.create : mode === 'edit' ? definition.update : definition.read;
    if (!required || !hasPermissions(actor.permissions, required))
        return (
            <section className="panel empty-page">
                <h1>Access restricted</h1>
                <p>Your account does not have permission for this action.</p>
            </section>
        );
    const account = module === 'admins' || module === 'users';
    const [record, roles, permissions] = await Promise.all([
        id ? findCrm(module, id) : {},
        account && actor.permissions.includes('roles.read') ? catalog('roles') : [],
        (account || module === 'roles') && actor.permissions.includes('permissions.read') ? catalog('permissions') : [],
    ]);
    return <CrmEditor name={module as ModuleName} mode={mode} record={record} roles={roles} permissions={permissions} actor={actor} />;
}
