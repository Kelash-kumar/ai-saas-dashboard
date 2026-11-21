'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useSession } from '@/components/providers/session-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useNotifications } from '@/components/providers/notification-provider';
import { authApi, ApiError } from '@/lib/api/client';
import { Icon } from '@/components/ui/icon';
export function AccountMenu() {
    const { principal, permissions } = useSession(),
        { t } = useLocale(),
        notify = useNotifications();
    const [busy, setBusy] = useState(false);
    const [clearing, setClearing] = useState(false);
    const name = [principal.firstName, principal.lastName].filter(Boolean).join(' ') || principal.email.split('@')[0];
    const role = t(permissions.includes('admin.access') ? 'header.admin' : 'auth.memberLabel');
    const avatar = principal.avatarData ? <Image src={principal.avatarData} alt="" width={64} height={64} unoptimized /> : <Icon name="user" className="size-full" />;
    async function exit(lock = false) {
        if (busy) return;
        setBusy(true);
        try {
            await authApi.logout();
            window.location.assign(lock ? '/login?reason=locked' : '/login');
        } catch (reason) {
            setBusy(false);
            notify(reason instanceof ApiError ? reason.message : 'Unable to reach the server. Please try again.', 'error');
        }
    }
    async function clearCache() {
        setClearing(true);
        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.filter((key) => /^(foundation-|vristo-)/.test(key)).map((key) => caches.delete(key)));
            }
            // A full navigation discards the private Next.js router cache. Identity and data are no-store.
            window.location.reload();
        } catch {
            setClearing(false);
            notify(t('header.cacheError'), 'error');
        }
    }
    return (
        <Menu>
            <MenuButton className="header-profile-button" aria-label={t('header.menu')} disabled={busy || clearing}>
                <span className="header-profile-avatar">{avatar}</span>
                <span className="header-profile-status" title={t('header.signedIn')} />
            </MenuButton>
            <MenuItems anchor="bottom end" className="header-profile-menu">
                <div className="header-profile-summary">
                    <span className="header-summary-avatar">{avatar}</span>
                    <div>
                        <strong>{name}</strong>
                        <span>{principal.email}</span>
                        <small>{role}</small>
                    </div>
                </div>
                <div className="header-profile-actions">
                    <MenuItem>
                        <Link href="/account">
                            <Icon name="user" className="size-5" />
                            {t('header.profile')}
                        </Link>
                    </MenuItem>
                    <MenuItem>
                        <button type="button" disabled={clearing || busy} onClick={() => void clearCache()}>
                            <Icon name="refresh" className="size-5" />
                            {clearing ? t('common.loading') : t('header.cache')}
                        </button>
                    </MenuItem>
                    <MenuItem>
                        <button type="button" disabled={busy} onClick={() => void exit(true)}>
                            <Icon name="admin" className="size-5" />
                            {t('header.lock')}
                        </button>
                    </MenuItem>
                </div>
                <div className="header-profile-signout">
                    <MenuItem>
                        <button type="button" disabled={busy} onClick={() => void exit()}>
                            <Icon name="logout" className="size-5" />
                            {busy ? t('common.loading') : t('auth.logout')}
                        </button>
                    </MenuItem>
                </div>
            </MenuItems>
        </Menu>
    );
}
