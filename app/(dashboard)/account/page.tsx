import { requireSession } from '@/lib/auth/server';
import { getI18n } from '@/lib/i18n-server';
export default async function Account() {
    const session = await requireSession();
    const { t } = await getI18n();
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">{t('dashboard.account')}</span>
                    <h1>{t('nav.account')}</h1>
                    <p>{session.principal.email}</p>
                </div>
            </div>
            <section className="panel">
                <h2 className="font-bold mb-4">{t('dashboard.roles')}</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                    {session.roles.length ? (
                        session.roles.map((role) => (
                            <span className="badge" key={role}>
                                {role}
                            </span>
                        ))
                    ) : (
                        <span className="muted">{t('dashboard.noRoles')}</span>
                    )}
                </div>
                <h2 className="font-bold mb-4">{t('dashboard.permissions')}</h2>
                <div className="flex flex-wrap gap-2">
                    {session.permissions.length ? (
                        session.permissions.map((permission) => (
                            <span className="badge badge-neutral" key={permission}>
                                {permission}
                            </span>
                        ))
                    ) : (
                        <span className="muted">{t('dashboard.member')}</span>
                    )}
                </div>
            </section>
        </>
    );
}
