'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { globalLoading } from '@/lib/loading/loading-store';

export function useGlobalLoader() {
    const snapshot = useSyncExternalStore(globalLoading.subscribe, globalLoading.getSnapshot, globalLoading.getServerSnapshot);
    return {
        isLoading: snapshot.pendingCount > 0,
        pendingCount: snapshot.pendingCount,
        message: snapshot.message,
        startLoading: globalLoading.start,
        withLoading: globalLoading.run,
    };
}

/** Bridge an existing transition/loading flag, including cleanup on unmount. */
export function useGlobalLoadingEffect(active: boolean, message?: string) {
    useEffect(() => {
        if (active) return globalLoading.start(message);
    }, [active, message]);
}
