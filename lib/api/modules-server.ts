import 'server-only';
import { cookies } from 'next/headers';
import { moduleDefinition } from '@/config/modules';
import type { PageData } from '@/config/modules';
import { apiRequest, backendFailure } from './server';
import { ApiError } from './errors';
import { requireApiSession } from '@/lib/auth/authorization';
import { accessCookie } from '@/lib/auth/server';
export function listQuery(input: Record<string, string | undefined>) {
    const result = new URLSearchParams();
    for (const key of ['page', 'limit', 'search', 'sortBy', 'sortOrder', 'companyId']) if (input[key]) result.set(key, input[key]!);
    return result.toString();
}
export async function moduleRequest(name: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', id?: string, body?: unknown, query = '') {
    const definition = moduleDefinition(name);
    if (!definition) throw new ApiError(404, 'Module not found.');
    if (id && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) throw new ApiError(400, 'Invalid record identifier.');
    const required = method === 'GET' ? definition.read : method === 'POST' ? definition.create : method === 'PATCH' ? definition.update : definition.remove;
    if (!required) throw new ApiError(405, 'This operation is unavailable.');
    await requireApiSession(required);
    if (method === 'POST' || method === 'PATCH') {
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Invalid form data.');
        const allowed = method === 'POST' ? definition.fields : definition.fields.filter((key) => !definition.createOnly?.includes(key));
        if (Object.keys(body).some((key) => !allowed.includes(key))) throw new ApiError(400, 'Unsupported form field.');
    }
    const access = (await cookies()).get(accessCookie)?.value;
    const response = await apiRequest(definition.path + (id ? '/' + id : '') + (query ? '?' + query : ''), { method, access, body });
    if (!response.ok) await backendFailure(response);
    return response;
}
export async function listModule(name: string, input: Record<string, string | undefined> = {}): Promise<PageData> {
    const response = await moduleRequest(name, 'GET', undefined, undefined, listQuery(input));
    return (await response.json()) as PageData;
}
