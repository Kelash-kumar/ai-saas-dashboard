'use client';

import { defaultTheme, normalizeTheme, readThemeDocument, exportTheme, THEME_STORAGE_KEY, accentColors } from '@/config/theme';
import type { ThemeSettings } from '@/config/theme';

export interface ThemeSnapshot {
    settings: ThemeSettings;
    resolvedMode: 'light' | 'dark';
    storageAvailable: boolean;
}
const serverSnapshot: ThemeSnapshot = { settings: { ...defaultTheme }, resolvedMode: 'light', storageAvailable: true };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
let cleanup: (() => void) | undefined;

function apply(settings: ThemeSettings, storageAvailable = snapshot.storageAvailable): void {
    const resolvedMode = settings.mode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : settings.mode;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(settings)) root.dataset[key] = value;
    root.dataset.mode = resolvedMode;
    root.dataset.themeMode = settings.mode;
    root.dir = settings.direction;
    root.style.colorScheme = resolvedMode;
    root.style.setProperty('--accent', accentColors[settings.accent]);
    snapshot = { settings, resolvedMode, storageAvailable };
    for (const notify of listeners) notify();
}

function load(): void {
    try {
        apply(readThemeDocument(localStorage.getItem(THEME_STORAGE_KEY)), true);
    } catch {
        apply({ ...defaultTheme }, false);
    }
}

export function subscribeTheme(notify: () => void): () => void {
    listeners.add(notify);
    if (listeners.size === 1) {
        load();
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const systemChanged = () => {
            if (snapshot.settings.mode === 'system') apply(snapshot.settings);
        };
        const storageChanged = (event: StorageEvent) => {
            if (event.key === THEME_STORAGE_KEY || event.key === null) load();
        };
        media.addEventListener('change', systemChanged);
        window.addEventListener('storage', storageChanged);
        cleanup = () => {
            media.removeEventListener('change', systemChanged);
            window.removeEventListener('storage', storageChanged);
        };
    }
    return () => {
        listeners.delete(notify);
        if (!listeners.size) {
            cleanup?.();
            cleanup = undefined;
        }
    };
}
export const getThemeSnapshot = () => snapshot;
export const getServerThemeSnapshot = () => serverSnapshot;

export function updateTheme(patch: Partial<ThemeSettings>): void {
    const settings = normalizeTheme({ ...snapshot.settings, ...patch });
    let available = true;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, exportTheme(settings));
    } catch {
        available = false;
    }
    apply(settings, available);
}
export function resetTheme(): void {
    let available = true;
    try {
        localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
        available = false;
    }
    apply({ ...defaultTheme }, available);
}
