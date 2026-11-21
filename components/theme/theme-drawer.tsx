'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Link from 'next/link';
import { ThemeField, ResetThemeButton } from './theme-controls';
import { Icon } from '@/components/ui/icon';
export function ThemeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onClose={onClose} className="fixed inset-0 z-60">
            <DialogBackdrop className="dialog-backdrop" />
            <div className="drawer-viewport">
                <DialogPanel className="theme-drawer">
                    <div className="drawer-heading">
                        <div>
                            <span className="eyebrow">MAKE IT YOURS</span>
                            <DialogTitle>Theme preferences</DialogTitle>
                        </div>
                        <button className="icon-button" type="button" aria-label="Close theme preferences" onClick={onClose}>
                            <Icon name="close" className="size-5" />
                        </button>
                    </div>
                    <p className="muted text-sm">A few small changes. A workspace that feels like you.</p>
                    <div className="drawer-fields">
                        {(['mode', 'accent', 'navigation', 'width', 'direction'] as const).map((field) => (
                            <ThemeField key={field} field={field} compact />
                        ))}
                    </div>
                    <Link href="/settings/appearance" className="btn btn-primary w-full" onClick={onClose}>
                        All appearance settings <span aria-hidden="true">↗</span>
                    </Link>
                    <div className="drawer-footer">
                        <ResetThemeButton />
                        <span className="muted text-xs">Saved on this browser</span>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
