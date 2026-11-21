'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { renewAccess } from '@/lib/api/client';
import type { Portal } from '@/lib/auth/types';
export function RenewSession({ portal, destination }: { portal: Portal; destination: string }) {
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        async function renew() {
            if (!navigator.locks) {
                window.location.replace('/login' + '?reason=expired');
                return;
            }
            if (!active) return;
            try {
                if (await renewAccess()) {
                    if (active) window.location.replace(new URL(destination, location.origin).href);
                } else if (active) window.location.replace('/login?reason=expired');
            } catch {
                if (active) setError(true);
            }
        }
        void renew();
        return () => {
            active = false;
        };
    }, [portal, destination]);
    return (
        <main className="auth-renew">
            <span className="workspace-initial">F</span>
            <h1>{error ? 'Unable to restore your session' : 'Restoring your workspace…'}</h1>
            <p>{error ? 'The sign-in service is unavailable. Please try again.' : 'Just a moment while we securely reconnect you.'}</p>
            {error && (
                <Link className="btn btn-primary" href={'/login'}>
                    Back to sign in
                </Link>
            )}
        </main>
    );
}
