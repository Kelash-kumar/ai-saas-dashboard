'use client';
import { useState } from 'react';
import { authApi, ApiError } from '@/lib/api/client';
import { useLocale } from '@/components/providers/locale-provider';
export function useSignOut() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function signOut(locked = false) {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await authApi.logout();
            window.location.assign(new URL(locked ? '/login?reason=locked' : '/login', window.location.origin).href);
        } catch (reason) {
            const message = reason instanceof ApiError ? reason.message : 'Unable to reach the server. Please try again.';
            setError(message);
            setBusy(false);
            throw new Error(message);
        }
    }
    return { busy, error, signOut };
}
export function LogoutButton() {
    const { t } = useLocale();
    const { busy, error, signOut } = useSignOut();
    return (
        <>
            <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => {
                    void signOut().catch(() => {});
                }}
            >
                {busy ? t('common.loading') : t('auth.logout')}
            </button>
            {error && (
                <span role="alert" className="text-xs text-red-600">
                    {error}
                </span>
            )}
        </>
    );
}
