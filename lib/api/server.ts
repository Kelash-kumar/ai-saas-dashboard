import 'server-only';
import { serverConfig } from '@/config/server';
import { ApiError } from './errors';
export function checkOrigin(request: Request) {
    const incoming = request.headers.get('origin');
    const { origin, secure } = serverConfig;
    const allowed = [origin.origin];
    if (!secure && ['localhost', '127.0.0.1'].includes(origin.hostname)) allowed.push(origin.origin.replace(origin.hostname, origin.hostname === 'localhost' ? '127.0.0.1' : 'localhost'));
    if (!incoming || !allowed.includes(incoming) || request.headers.get('sec-fetch-site') === 'cross-site') throw new ApiError(403, 'Request origin is not permitted.');
}
export async function apiRequest(path: string, options: { body?: unknown; access?: string; refresh?: string; csrf?: string; method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' } = {}) {
    const headers: Record<string, string> = { Accept: 'application/json', Origin: serverConfig.origin.origin };
    if (options.access) headers.Authorization = 'Bearer ' + options.access;
    if (options.refresh) headers.Cookie = serverConfig.refreshName + '=' + options.refresh;
    if (options.csrf) headers['X-CSRF-Token'] = options.csrf;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    try {
        return await fetch(serverConfig.baseUrl.href.replace(/\/$/, '') + '/' + path, {
            method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(serverConfig.timeout),
            redirect: 'error',
        });
    } catch {
        throw new ApiError(503, 'The service is unavailable. Please try again shortly.');
    }
}
export async function decodeData(response: Response): Promise<Record<string, unknown>> {
    let value: unknown;
    try {
        value = await response.json();
    } catch {
        throw new ApiError(502, 'Unexpected service response.');
    }
    if (!value || typeof value !== 'object' || !('data' in value) || !value.data || typeof value.data !== 'object') throw new ApiError(502, 'Unexpected service response.');
    return value.data as Record<string, unknown>;
}
export async function backendFailure(response: Response) {
    let message = 'The request could not be completed.';
    try {
        const value: unknown = await response.json();
        if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') message = value.message;
    } catch {}
    throw new ApiError(response.status, message);
}
