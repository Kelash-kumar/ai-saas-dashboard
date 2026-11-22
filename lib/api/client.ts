import { ApiError } from './errors';
import { globalLoading } from '@/lib/loading/loading-store';
export { ApiError } from './errors';
export interface RequestOptions {
    signal?: AbortSignal;
    renew?: boolean;
    /** Set false for background work, or provide a custom loading message. */
    loading?: boolean | string;
}
interface ExecuteOptions extends RequestOptions {
    method?: string;
    body?: unknown;
    blob?: boolean;
}
export async function renewAccess(): Promise<boolean> {
    if (!navigator.locks) return false;
    return navigator.locks.request('foundation-session', async () => {
        const response = await fetch('/api/session/refresh', { method: 'POST', credentials: 'same-origin' });
        if (response.status >= 500 || response.status === 429) throw new ApiError(response.status, 'The sign-in service is unavailable. Please try again shortly.');
        return response.ok;
    });
}
async function execute<T>(path: string, options: ExecuteOptions = {}, retried = false): Promise<T> {
    if (!path.startsWith('/api/')) throw new ApiError(400, 'Only application API paths are allowed.');
    let response: Response;
    try {
        response = await fetch(path, {
            method: options.method ?? 'GET',
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            headers: options.body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
        });
    } catch (error) {
        if (options.signal?.aborted) throw error;
        throw new ApiError(503, 'Unable to reach the service. Please try again.');
    }
    if (response.status === 401 && options.renew !== false && !retried) {
        if (await renewAccess()) {
            if ((options.method ?? 'GET') === 'GET') return execute<T>(path, options, true);
            throw new ApiError(409, 'Your session was renewed. Please submit your changes again.');
        }
        window.location.assign(new URL('/login?reason=expired', location.origin).href);
        throw new ApiError(401, 'Please sign in again.');
    }
    if (response.status === 204) return undefined as T;
    if (response.ok && options.blob) return (await response.blob()) as T;
    let body: unknown;
    try {
        body = await response.json();
    } catch {
        throw new ApiError(502, 'Unexpected service response.');
    }
    if (!response.ok) {
        const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined;
        throw new ApiError(response.status, typeof message === 'string' ? message : 'The request could not be completed.');
    }
    return body as T;
}
function request<T>(path: string, options: ExecuteOptions): Promise<T> {
    const task = () => execute<T>(path, options);
    // Server calls must never share a browser loading task across requests.
    if (typeof window === 'undefined' || options.loading === false) return task();
    return globalLoading.run(task, typeof options.loading === 'string' ? options.loading : undefined);
}
export const http = {
    download: (path: string, options: RequestOptions = {}) => request<Blob>(path, { ...options, blob: true }),
    get: <T>(path: string, options: RequestOptions = {}) => request<T>(path, options),
    post: <T>(path: string, body: unknown, options: RequestOptions = {}) => request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body: unknown, options: RequestOptions = {}) => request<T>(path, { ...options, method: 'PATCH', body }),
};
export const authApi = {
    login: (email: string, password: string, portal: 'admin' | 'user') =>
        http.post<{ destination?: string; mfaRequired?: boolean }>('/api/session/login', { email, password, portal }, { renew: false }),
    verifyLogin: (code: string) => http.post('/api/session/login/verify', { code }, { renew: false }),
    logout: () => http.post('/api/session/logout', {}, { renew: false }),
    verify: (token: string) => http.post('/api/session/verify', { token }, { renew: false }),
};
