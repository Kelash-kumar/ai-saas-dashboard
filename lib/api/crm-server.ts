import 'server-only';
import { cookies } from 'next/headers';
import { moduleDefinition } from '@/config/modules';
import { requireApiSession } from '@/lib/auth/authorization';
import { accessCookie } from '@/lib/auth/server';
import { apiRequest, backendFailure } from './server';
import { ApiError } from './errors';
import type { PageData } from '@/config/modules';
export function crmQuery(input: Record<string, string | undefined>) {
    return new URLSearchParams(
        Object.entries(input).filter(
            ([key, value]) => ['page', 'limit', 'search', 'sortBy', 'sortOrder', 'companyId', 'fromDate', 'toDate', 'deleted', 'guard', 'format'].includes(key) && value !== undefined,
        ) as [string, string][],
    ).toString();
}
export async function crmRequest(name: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', segment = '', body?: unknown, query = '') {
    const definition = moduleDefinition(name);
    if (!definition) throw new ApiError(404, 'Module not found.');
    if (segment && !['export', 'bulk'].includes(segment) && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(segment)) throw new ApiError(400, 'Invalid identifier.');
    const permission =
        segment === 'export'
            ? name + '.export'
            : segment === 'bulk'
              ? name + '.' + (body && typeof body === 'object' && 'action' in body && body.action === 'restore' ? 'restore' : 'delete')
              : method === 'GET'
                ? name + '.read'
                : name + (method === 'POST' ? '.create' : '.update');
    await requireApiSession(segment === 'export' ? [name + '.read', permission] : [permission]);
    const response = await apiRequest('crm/' + name + (segment ? '/' + segment : '') + (query ? '?' + query : ''), { method, body, access: (await cookies()).get(accessCookie)?.value });
    if (!response.ok) await backendFailure(response);
    return response;
}
export async function listCrm(name: string, query: Record<string, string | undefined> = {}): Promise<PageData> {
    return (await crmRequest(name, 'GET', '', undefined, crmQuery(query))).json();
}
export async function findCrm(name: string, id: string): Promise<Record<string, unknown>> {
    return ((await (await crmRequest(name, 'GET', id)).json()) as { data: Record<string, unknown> }).data;
}
export async function catalog(name: 'roles' | 'permissions' | 'companies') {
    const result: Record<string, unknown>[] = [];
    for (let page = 1; page <= 50; page++) {
        const response = await listCrm(name, { page: String(page), limit: '100', sortOrder: 'asc' });
        if (response.meta.total > 5000) throw new ApiError(413, 'Catalog too large. Narrow the catalog before managing grants.');
        result.push(...response.data);
        if (!response.meta.hasNextPage) break;
    }
    return result;
}
