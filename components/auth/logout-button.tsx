'use client';
import { useState } from 'react';
import { authApi, ApiError } from '@/lib/api/client';
import { useLocale } from '@/components/providers/locale-provider';
export function LogoutButton() {
    const { t } = useLocale();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    return (
        <>
            <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try {
                        await authApi.logout();
                        window.location.assign(new URL('/login', window.location.origin).href);
                    } catch (reason) {
                        setError(reason instanceof ApiError ? reason.message : 'Unable to reach the server. Please try again.');
                        setBusy(false);
                    }
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
