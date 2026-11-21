import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/server';
import { moduleDefinition } from '@/config/modules';
import type { ModuleName } from '@/config/modules';
import { hasPermissions } from '@/lib/auth/permissions';
import { getI18n } from '@/lib/i18n-server';
import { listModule } from '@/lib/api/modules-server';
import { ModuleWorkspace } from '@/components/modules/module-workspace';
export default async function ModulePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { module } = await params;
    const definition = moduleDefinition(module);
    if (!definition) notFound();
    const session = await requireSession();
    const { t } = await getI18n();
    if (!hasPermissions(session.permissions, definition.read))
        return (
            <section className="panel empty-page">
                <h1>{t('common.denied')}</h1>
                <p>{t('common.deniedText')}</p>
            </section>
        );
    const input = await searchParams;
    const query = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
    const page = await listModule(module, query);
    return <ModuleWorkspace name={module as ModuleName} page={page} permissions={session.permissions} query={query} />;
}
