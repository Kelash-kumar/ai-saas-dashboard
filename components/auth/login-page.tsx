'use client';
import { useState } from 'react';
import { useLocale, LocaleSwitcher } from '@/components/providers/locale-provider';
import Image from 'next/image';
import Link from 'next/link';
import type { Portal } from '@/lib/auth/types';
import { LoginForm } from './login-form';
import { Icon } from '@/components/ui/icon';
export function LoginPage({ initialPortal = 'admin', initialMfa = false, locked = false }: { initialPortal?: Portal; initialMfa?: boolean; locked?: boolean }) {
    const [portal, setPortal] = useState<Portal>(initialPortal);
    const { t } = useLocale();
    const admin = portal === 'admin';
    return (
        <main className={'login-page ' + (admin ? 'admin-login' : 'user-login')}>
            <section className="login-story" aria-label={admin ? 'Admin workspace' : 'User workspace'}>
                <Link href={'/login/' + portal} className="brand">
                    <Image src="/assets/images/logo.svg" alt="" width={34} height={34} />
                    <span className="brand-text">
                        VRISTO<small>FOUNDATION WORKSPACE</small>
                    </span>
                </Link>
                <div className="login-story-content">
                    <span className="login-eyebrow">{admin ? 'THE WORKSPACE BEHIND THE WORK' : 'YOUR SPACE TO GET THINGS DONE'}</span>
                    <h1>
                        {admin ? (
                            <>
                                A clear view.
                                <br />A confident start.
                            </>
                        ) : (
                            <>
                                A familiar space.
                                <br />A fresh start.
                            </>
                        )}
                    </h1>
                    <p>{admin ? 'The right people. The right access. A thoughtfully organized place to manage it all.' : 'Pick up where you left off. Your workspace is ready when you are.'}</p>
                    <div className="login-illustration" aria-hidden="true">
                        <div className="login-mini-nav">
                            <span>V</span>
                            <i />
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className="login-mini-content">
                            <div>
                                <span />
                                <b>Foundation</b>
                                <em />
                            </div>
                            <strong>{admin ? 'Everything in perspective.' : 'Welcome back.'}</strong>
                            <i />
                            <section>
                                <span />
                                <span />
                                <span />
                            </section>
                            <article>
                                {[35, 65, 50, 78, 58, 90, 72, 100, 83].map((height, index) => (
                                    <i key={index} style={{ height: height + '%' }} />
                                ))}
                            </article>
                        </div>
                        <div className="login-art-note">
                            <Icon name="check" className="size-5" />
                            <span>{admin ? 'Access with confidence' : 'A workspace that feels like you'}</span>
                        </div>
                    </div>
                    <div className="login-story-foot">
                        <span className="login-security-icon">
                            <Icon name="check" className="size-5" />
                        </span>
                        <div>
                            <strong>Made for the people who belong here.</strong>
                            <p>Your account is provided by your administrator.</p>
                        </div>
                    </div>
                </div>
                <p className="login-copyright">© {new Date().getFullYear()} VRISTO · Foundation edition</p>
            </section>
            <section className="login-form-area">
                <div className="login-portal-switch">
                    <LocaleSwitcher />
                </div>
                <div className="login-form-wrap">
                    <div className="login-form-icon">
                        <Icon name={admin ? 'settings' : 'users'} className="size-6" />
                    </div>
                    <span className="eyebrow">{admin ? 'ADMIN PORTAL' : 'USER PORTAL'}</span>
                    <h2>{t(locked ? 'header.locked' : 'auth.welcome')}</h2>
                    {locked && (
                        <p className="login-access-note" role="status">
                            {t('header.lockedHelp')}
                        </p>
                    )}
                    <p className="login-intro">{admin ? 'Sign in to your administration workspace.' : 'Sign in to continue to your workspace.'}</p>
                    <div className="login-options" role="group" aria-label="Login option">
                        {(['admin', 'user'] as const).map((value) => (
                            <button key={value} type="button" aria-pressed={portal === value} className={portal === value ? 'is-active' : ''} onClick={() => setPortal(value)}>
                                {t('auth.' + value)}
                            </button>
                        ))}
                    </div>
                    <LoginForm key={portal} portal={portal} initialMfa={initialMfa && portal === initialPortal} />
                    <p className="login-account-note">
                        Need access or help signing in?
                        <br />
                        <strong>Contact your administrator.</strong>
                    </p>
                </div>
                <div className="login-form-footer">
                    <Icon name="check" className="size-4" />
                    <span>Secure access · Your credentials stay private</span>
                </div>
            </section>
        </main>
    );
}
