import { requireSession } from '@/lib/auth/server';
import { hasPermissions } from '@/lib/auth/permissions';
import { getI18n } from '@/lib/i18n-server';
import { userAccess } from '@/lib/api/access-server';
import { listModule, moduleRequest } from '@/lib/api/modules-server';
import { AccessManager } from '@/components/modules/access-manager';
export default async function AccessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await requireSession();
    const { t } = await getI18n();
    if (!hasPermissions(session.permissions, ['users.read']))
        return (
            <section className="panel empty-page">
                <h1>{t('common.denied')}</h1>
                <p>{t('common.deniedText')}</p>
            </section>
        );
    const [authority, profile, roles, permissions] = await Promise.all([
        userAccess(id),
        moduleRequest('users', 'GET', id)
            .then((response) => response.json())
            .then((value) => (value as { data: { email: string } }).data),
        hasPermissions(session.permissions, ['roles.read']) ? listModule('roles', { limit: '100' }) : null,
        hasPermissions(session.permissions, ['permissions.read']) ? listModule('permissions', { limit: '100' }) : null,
    ]);
    return <AccessManager userId={id} email={profile.email} authority={authority} roles={roles?.data ?? []} catalog={permissions?.data ?? []} actor={session} />;
}
