import { RenewSession } from '@/components/auth/renew-session';
import { safeDestination } from '@/lib/auth/types';
export default async function Renew({ searchParams }: { searchParams: Promise<{ portal?: string; next?: string }> }) {
    const query = await searchParams;
    const portal = query.portal === 'user' ? 'user' : 'admin';
    return <RenewSession portal={portal} destination={safeDestination(query.next)} />;
}
