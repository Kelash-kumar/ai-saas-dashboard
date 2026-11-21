'use client';
import { createContext, useContext } from 'react';
import type { SessionView } from '@/lib/auth/types';
const Context = createContext<SessionView | null>(null);
export function SessionProvider({ session, children }: { session: SessionView; children: React.ReactNode }) {
    return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSession() {
    const value = useContext(Context);
    if (!value) throw new Error('SessionProvider required');
    return value;
}
