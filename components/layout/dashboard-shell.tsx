'use client';

import { useEffect, useState } from 'react';
import type { SessionView } from '@/lib/auth/types';
import { AccountMenu } from './account-menu';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { appConfig, visibleNavigation } from '@/config/app';
import { SessionProvider, useSession } from '@/components/providers/session-provider';
import { useLocale, LocaleSwitcher } from '@/components/providers/locale-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { ThemeDrawer } from '@/components/theme/theme-drawer';
import { Icon } from '@/components/ui/icon';

function Brand() {
    return (
        <Link href="/" className="brand" aria-label={`${appConfig.brand} overview`}>
            <Image src="/assets/images/logo.svg" alt="" width={31} height={31} priority />
            <span className="brand-text">
                {appConfig.brand}
                <small>WORKSPACE</small>
            </span>
        </Link>
    );
}

function NavLinks({ close, horizontal = false }: { close?: () => void; horizontal?: boolean }) {
    const pathname = usePathname();
    const { permissions } = useSession();
    const { t } = useLocale();
    return (
        <nav aria-label={horizontal ? 'Horizontal navigation' : 'Main navigation'} className={horizontal ? 'horizontal-links' : 'nav-groups'}>
            {visibleNavigation(permissions).map((group) => (
                <div className="nav-group" key={group.key}>
                    {!horizontal && <h2 className="nav-group-title">{t(group.key)}</h2>}
                    {group.items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            title={t(item.key, item.label)}
                            className={'nav-link ' + (pathname === item.href ? 'active' : '')}
                            aria-current={pathname === item.href ? 'page' : undefined}
                        >
                            <Icon name={item.icon} className="size-5" />
                            <span className="nav-label">{t(item.key, item.label)}</span>
                            {pathname === item.href && <i className="nav-active-dot" />}
                        </Link>
                    ))}
                </div>
            ))}
        </nav>
    );
}

function SidebarContent({ close }: { close?: () => void }) {
    return (
        <>
            <div className="brand-row">
                <Brand />
                {close && (
                    <button type="button" onClick={close} className="icon-button" aria-label="Close navigation">
                        <Icon name="close" className="size-5" />
                    </button>
                )}
            </div>
            <NavLinks close={close} />
            <div className="sidebar-bottom">
                <div className="sidebar-edition">
                    <span className="status-dot" />
                    <span>{appConfig.brand}</span>
                </div>
            </div>
        </>
    );
}

function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { permissions } = useSession();
    const { t } = useLocale();
    const navigation = visibleNavigation(permissions);
    const [query, setQuery] = useState('');
    const pages = navigation.flatMap((group) => group.items);
    const matches = pages.filter((item) => t(item.key, item.label).toLowerCase().includes(query.toLowerCase()));
    return (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-70">
            <DialogBackdrop className="dialog-backdrop" />
            <div className="command-viewport">
                <DialogPanel className="command-panel">
                    <DialogTitle className="sr-only">Find a page</DialogTitle>
                    <div className="command-search">
                        <Icon name="search" className="size-5 muted" />
                        <input autoFocus aria-label="Find a page" placeholder="Where would you like to go?" value={query} onChange={(event) => setQuery(event.target.value)} />
                        <button className="kbd" type="button" aria-label="Close search" onClick={onClose}>
                            esc
                        </button>
                    </div>
                    <p className="command-section">PAGES</p>
                    <div className="command-results">
                        {matches.length ? (
                            matches.map((item) => (
                                <Link key={item.href} href={item.href} onClick={onClose}>
                                    <Icon name={item.icon} className="size-5 text-primary" />
                                    <span>{item.label}</span>
                                    <span aria-hidden="true">↗</span>
                                </Link>
                            ))
                        ) : (
                            <p className="command-empty">No pages found. Try “appearance” or “overview”.</p>
                        )}
                    </div>
                    <div className="command-footer">Use Tab to move between results and Enter to open a page.</div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    const session = useSession();
    const { t } = useLocale();
    const pathname = usePathname();
    const { resolvedMode, update } = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen((value) => !value);
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);
    const currentItem = visibleNavigation(session.permissions)
        .flatMap((group) => group.items)
        .filter((item) => (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')))
        .sort((left, right) => right.href.length - left.href.length)[0];
    const title = currentItem ? t(currentItem.key, currentItem.label) : t(pathname === '/account' ? 'header.profile' : 'nav.overview');
    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to content
            </a>
            <div className="admin-frame">
                <aside className="sidebar">
                    <SidebarContent />
                </aside>
                <div className="workspace">
                    <header className="workspace-header">
                        <div className="header-surface">
                            <div className="flex min-w-0 items-center gap-3">
                                <button type="button" className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                                    <Icon name="menu" className="size-5" />
                                </button>
                                <div className="horizontal-brand">
                                    <Brand />
                                </div>
                                <div className="breadcrumbs">
                                    <span>Workspace</span>
                                    <span aria-hidden="true">/</span>
                                    <strong>{title}</strong>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button type="button" className="search-launcher" aria-label="Find a page" onClick={() => setSearchOpen(true)}>
                                    <Icon name="search" className="size-4" />
                                    <span>Quick search</span>
                                    <kbd>Ctrl K</kbd>
                                </button>
                                <span className="header-divider" />
                                <button
                                    type="button"
                                    className="icon-button"
                                    onClick={() => update({ mode: resolvedMode === 'dark' ? 'light' : 'dark' })}
                                    aria-label={`Switch to ${resolvedMode === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    <Icon name={resolvedMode === 'dark' ? 'sun' : 'moon'} className="size-5" />
                                </button>
                                <button type="button" className="icon-button" aria-label="Customize theme" onClick={() => setDrawerOpen(true)}>
                                    <Icon name="laptop" className="size-5" />
                                </button>
                                <LocaleSwitcher compact />
                                <AccountMenu />
                            </div>
                        </div>
                        <NavLinks horizontal />
                    </header>
                    <main id="main-content" className="page-content" tabIndex={-1}>
                        {children}
                    </main>
                    <footer className="workspace-footer">
                        <span>
                            © {new Date().getFullYear()} {appConfig.brand}. Crafted for your workspace.
                        </span>
                        <span>
                            Foundation edition <i />
                        </span>
                    </footer>
                </div>
            </div>
            <button type="button" className="floating-customizer" aria-label="Open theme preferences" onClick={() => setDrawerOpen(true)}>
                <Icon name="settings" className="size-5" />
            </button>
            <ThemeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <CommandMenu key={String(searchOpen)} open={searchOpen} onClose={() => setSearchOpen(false)} />
            <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} className="fixed inset-0 z-60 mobile-navigation-dialog">
                <DialogBackdrop className="dialog-backdrop" />
                <DialogPanel className="mobile-sidebar">
                    <DialogTitle className="sr-only">Navigation</DialogTitle>
                    <SidebarContent close={() => setMobileOpen(false)} />
                </DialogPanel>
            </Dialog>
        </>
    );
}

export function DashboardShell({ children, session }: { children: React.ReactNode; session: SessionView }) {
    return (
        <SessionProvider session={session}>
            <Shell>{children}</Shell>
        </SessionProvider>
    );
}
