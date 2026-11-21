'use client';
import { useState } from 'react';
import { authApi, ApiError } from '@/lib/api/client';
import { useLocale } from '@/components/providers/locale-provider';
import type { Portal } from '@/lib/auth/types';
export function LoginForm({ portal, initialMfa = false }: { portal: Portal; initialMfa?: boolean }) {
    const { t } = useLocale();
    const [mfa, setMfa] = useState(initialMfa);
    const [show, setShow] = useState(false),
        [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    return (
        <form
            className="login-form"
            onSubmit={async (event) => {
                event.preventDefault();
                if (busy) return;
                const data = new FormData(event.currentTarget);
                setBusy(true);
                setError('');
                try {
                    if (mfa) await authApi.verifyLogin(String(data.get('code') ?? ''));
                    else {
                        const result = await authApi.login(String(data.get('email') ?? ''), String(data.get('password') ?? ''), portal);
                        if (result.mfaRequired) {
                            setMfa(true);
                            setBusy(false);
                            return;
                        }
                    }
                    window.location.assign(new URL('/', window.location.origin).href);
                } catch (reason) {
                    setError(reason instanceof ApiError ? reason.message : 'Unable to reach the sign-in service. Please try again.');
                    setBusy(false);
                }
            }}
        >
            {mfa ? (
                <>
                    <p className="muted">Enter the six-digit code sent to your account email. It expires in five minutes.</p>
                    <label htmlFor="login-code">Verification code</label>
                    <input id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={busy} />
                    <button
                        className="text-sm"
                        type="button"
                        onClick={() => {
                            setMfa(false);
                            setError('');
                        }}
                    >
                        Restart sign-in
                    </button>
                </>
            ) : (
                <>
                    <label htmlFor="login-email">{t('auth.email')}</label>
                    <input id="login-email" name="email" type="email" autoComplete="username" placeholder="you@example.com" maxLength={320} required disabled={busy} />
                    <label htmlFor="login-password">{t('auth.password')}</label>
                    <div className="password-input">
                        <input
                            id="login-password"
                            name="password"
                            type={show ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            maxLength={128}
                            required
                            disabled={busy}
                        />
                        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((value) => !value)}>
                            {show ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </>
            )}
            <div className="login-access-note">
                <span aria-hidden="true">●</span> {portal === 'admin' ? 'For authorized administrators only' : 'For existing workspace accounts'}
            </div>
            {error && (
                <div className="login-error" role="alert">
                    {error}
                </div>
            )}
            <button type="submit" className="btn btn-primary login-submit" disabled={busy}>
                {busy ? t('common.loading') : t('auth.signin')}
                <span aria-hidden="true">→</span>
            </button>
        </form>
    );
}
