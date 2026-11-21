'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/client';
export default function VerifyEmail() {
    const [state, setState] = useState<'ready' | 'busy' | 'done' | 'error'>('ready');
    const [message, setMessage] = useState('');
    const [token, setToken] = useState('');
    return (
        <main className="auth-renew">
            <span className="workspace-initial">F</span>
            <h1>Verify your email</h1>
            <p>Confirm this address to activate access to your workspace.</p>
            {state !== 'done' ? (
                <button
                    className="btn btn-primary"
                    disabled={state === 'busy'}
                    onClick={async () => {
                        const value = token || new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
                        setToken(value);
                        history.replaceState(null, '', location.pathname);
                        setState('busy');
                        try {
                            await authApi.verify(value);
                            setState('done');
                            setMessage('Email verified. You can now sign in.');
                        } catch (error) {
                            setState('error');
                            setMessage(error instanceof Error ? error.message : 'Verification failed.');
                        }
                    }}
                >
                    {state === 'busy' ? 'Verifying…' : 'Verify email'}
                </button>
            ) : (
                <Link className="btn btn-primary" href="/login">
                    Continue to sign in
                </Link>
            )}
            {message && <p role={state === 'error' ? 'alert' : 'status'}>{message}</p>}
        </main>
    );
}
