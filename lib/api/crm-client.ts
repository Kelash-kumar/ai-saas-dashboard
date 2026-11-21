import { http } from './client';
import type { PageData } from '@/config/modules';
export const crmApi = {
    list: (name: string, query = '', signal?: AbortSignal) => http.get<PageData>('/api/crm/' + name + (query ? '?' + query : ''), signal),
    save: (name: string, body: unknown, id?: string) =>
        id ? http.patch<{ data: { id: string } }>('/api/crm/' + name + '/' + id, body) : http.post<{ data: { id: string } }>('/api/crm/' + name, body),
    bulk: (name: string, ids: string[], action: 'delete' | 'restore') => http.post('/api/crm/' + name + '/bulk', { ids, action }),
    export: async (name: string, query: string, format: 'csv' | 'xlsx') => {
        const params = new URLSearchParams(query);
        params.set('format', format);
        const blob = await http.download('/api/crm/' + name + '/export?' + params);
        const url = URL.createObjectURL(blob),
            link = document.createElement('a');
        link.href = url;
        link.download = name + '.' + format;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
};
