import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Locale } from '@/config/i18n';
import { localeCookie, translate } from '@/config/i18n';
export const getI18n = cache(async () => {
    const locale: Locale = (await cookies()).get(localeCookie)?.value === 'ur' ? 'ur' : 'en';
    return { locale, t: (key: string, fallback?: string) => translate(locale, key, fallback) };
});
