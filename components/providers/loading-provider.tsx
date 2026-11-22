'use client';

import type { ReactNode } from 'react';
import { useGlobalLoader } from '@/hooks/use-global-loader';
import { useLocale } from './locale-provider';
import { Loader } from '@/components/ui/loader';

/** Mounted once in the root layout; custom tasks and HTTP calls share one loader. */
export function LoadingProvider({ children }: { children: ReactNode }) {
    const { isLoading, message } = useGlobalLoader();
    const { t } = useLocale();
    return (
        <>
            {children}
            {isLoading && <Loader variant="fullscreen" size="lg" label={message ?? t('common.loading')} className="app-loader--delayed" />}
        </>
    );
}
