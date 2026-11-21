import { requireSession } from '@/lib/auth/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await requireSession();
    return <DashboardShell session={session}>{children}</DashboardShell>;
}
