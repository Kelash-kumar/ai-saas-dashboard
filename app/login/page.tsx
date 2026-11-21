import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth/server';
import { LoginPage } from '@/components/auth/login-page';
import { cookies } from 'next/headers';
import { challengeCookie } from '@/lib/auth/server';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string; reason?: string }> }) {
    if (await currentSession()) redirect('/');
    const query = await searchParams;
    const pending = /^([A-Za-z0-9_-]{43})\.(admin|user)$/.exec((await cookies()).get(challengeCookie)?.value ?? '');
    return <LoginPage initialPortal={pending?.[2] === 'user' || (!pending && query.as === 'user') ? 'user' : 'admin'} initialMfa={!!pending} locked={query.reason === 'locked'} />;
}
