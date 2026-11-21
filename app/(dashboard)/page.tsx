import Link from 'next/link';
import { requireSession } from '@/lib/auth/server';
import { visibleNavigation } from '@/config/app';
import { hasPermissions } from '@/lib/auth/permissions';
import { getI18n } from '@/lib/i18n-server';
import { listCrm } from '@/lib/api/crm-server';
import { Icon } from '@/components/ui/icon';
export default async function Dashboard() {
    const session = await requireSession();
    const { t } = await getI18n();
    const counts = await Promise.all(
        (['admins', 'users', 'companies'] as const)
            .filter((name) => hasPermissions(session.permissions, [name + '.read']))
            .map(async (name) => ({ name, total: (await listCrm(name, { limit: '1' })).meta.total })),
    );
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">{t('dashboard.welcome')}</span>
                    <h1>{t('dashboard.title')}</h1>
                    <p>{t('dashboard.description')}</p>
                </div>
                <span className="badge">{t(session.permissions.includes('admin.access') ? 'auth.adminLabel' : 'auth.memberLabel')}</span>
            </div>
            <div className="dashboard-stats">
                {counts.map((count) => (
                    <Link key={count.name} className="panel dashboard-stat" href={'/' + count.name}>
                        <span className="section-icon">
                            <Icon name={count.name !== 'companies' ? 'users' : 'company'} className="size-5" />
                        </span>
                        <span>{t('nav.' + count.name)}</span>
                        <strong>{count.total}</strong>
                    </Link>
                ))}
                <div className="panel dashboard-stat">
                    <span>{t('dashboard.roles')}</span>
                    <strong>{session.roles.length}</strong>
                </div>
                <div className="panel dashboard-stat">
                    <span>{t('dashboard.permissions')}</span>
                    <strong>{session.permissions.length}</strong>
                </div>
            </div>
            <section className="panel dashboard-tools">
                <div className="section-heading">
                    <div>
                        <h2>{t('dashboard.features')}</h2>
                        <p>{session.principal.email}</p>
                    </div>
                </div>
                <div className="dashboard-links">
                    {visibleNavigation(session.permissions)
                        .flatMap((group) => group.items)
                        .filter((item) => item.href !== '/')
                        .map((item) => (
                            <Link key={item.href} href={item.href}>
                                <span className="section-icon">
                                    <Icon name={item.icon} className="size-5" />
                                </span>
                                <span>{t(item.key, item.label)}</span>
                                <span aria-hidden="true">↗</span>
                            </Link>
                        ))}
                </div>
            </section>
            <section className="panel mt-6">
                <h2 className="font-bold mb-3">{t('dashboard.roles')}</h2>
                <div className="flex gap-2 flex-wrap">
                    {session.roles.length ? (
                        session.roles.map((role) => (
                            <span className="badge" key={role}>
                                {role}
                            </span>
                        ))
                    ) : (
                        <p className="muted text-sm">{t('dashboard.noRoles')}</p>
                    )}
                </div>
            </section>
        </>
    );
}
