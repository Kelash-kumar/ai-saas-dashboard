'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { translate, localeCookie } from '@/config/i18n';
import type { Locale } from '@/config/i18n';
import { useTheme } from '@/components/theme/theme-provider';
interface LocaleContext {
    locale: Locale;
    t: (key: string, fallback?: string) => string;
    change: (locale: Locale) => void;
}
const Context = createContext<LocaleContext | null>(null);
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
    const [locale, setLocale] = useState(initialLocale);
    const router = useRouter();
    const { update } = useTheme();
    const change = useCallback(
        (next: Locale) => {
            document.cookie = localeCookie + '=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
            document.documentElement.lang = next;
            update({ direction: next === 'ur' ? 'rtl' : 'ltr' });
            setLocale(next);
            router.refresh();
        },
        [router, update],
    );
    const t = useCallback((key: string, fallback?: string) => translate(locale, key, fallback), [locale]);
    const value = useMemo(() => ({ locale, t, change }), [locale, t, change]);
    return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLocale() {
    const value = useContext(Context);
    if (!value) throw new Error('LocaleProvider required');
    return value;
}
export function LocaleSwitcher() {
    const { locale, change } = useLocale();
    return (
        <select className="locale-switcher" aria-label="Language" value={locale} onChange={(event) => change(event.target.value === 'ur' ? 'ur' : 'en')}>
            <option value="en">English</option>
            <option value="ur">اردو</option>
        </select>
    );
}
