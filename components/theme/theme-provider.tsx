'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getThemeSnapshot, getServerThemeSnapshot, subscribeTheme, updateTheme, resetTheme } from './theme-store';
import type { ThemeSnapshot } from './theme-store';

const Context = createContext<(ThemeSnapshot & { update: typeof updateTheme; reset: typeof resetTheme }) | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
    const state = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
    return <Context.Provider value={{ ...state, update: updateTheme, reset: resetTheme }}>{children}</Context.Provider>;
}
export function useTheme() {
    const value = useContext(Context);
    if (!value) throw new Error('useTheme requires ThemeProvider');
    return value;
}
