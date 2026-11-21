import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth/server';
import { LoginPage } from '@/components/auth/login-page';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
    if (await currentSession()) redirect('/');
    const query = await searchParams;
    return <LoginPage initialPortal={query.as === 'user' ? 'user' : 'admin'} />;
}
