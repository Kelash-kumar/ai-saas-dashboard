'use client';
import { useEffect, useState } from 'react';
import type { ModuleName } from '@/config/modules';
import { crmApi } from '@/lib/api/crm-client';
export function useModuleOptions(name: ModuleName, query: string, enabled = true) {
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(enabled);
    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            void crmApi
                .list(name, 'limit=100&search=' + encodeURIComponent(query), controller.signal)
                .then((page) => {
                    setRows(page.data);
                    setError('');
                })
                .catch((reason) => {
                    if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load options.');
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 200);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [name, query, enabled]);
    return { rows, error, loading };
}
