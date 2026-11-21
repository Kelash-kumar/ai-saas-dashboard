import { http } from './client';
import type { ModuleName, PageData } from '@/config/modules';
export const modulesApi = {
    list: (name: ModuleName, query = '', signal?: AbortSignal) => http.get<PageData>('/api/modules/' + name + (query ? '?' + query : ''), signal),
    create: (name: ModuleName, body: unknown) => http.post('/api/modules/' + name, body),
    update: (name: ModuleName, id: string, body: unknown) => http.patch('/api/modules/' + name + '/' + id, body),
    remove: (name: ModuleName, id: string) => http.delete('/api/modules/' + name + '/' + id),
};
