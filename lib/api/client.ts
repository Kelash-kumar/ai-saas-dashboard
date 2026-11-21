import { ApiError } from './errors';
export { ApiError } from './errors';
export async function renewAccess(): Promise<boolean> {
    if (!navigator.locks) return false;
    return navigator.locks.request('foundation-session', async () => {
        const response = await fetch('/api/session/refresh', { method: 'POST', credentials: 'same-origin' });
        if (response.status >= 500 || response.status === 429) throw new ApiError(response.status, 'The sign-in service is unavailable. Please try again shortly.');
        return response.ok;
    });
}
async function execute<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal; renew?: boolean; blob?: boolean } = {}, retried = false): Promise<T> {
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
export const http = {
    download: (path: string) => execute<Blob>(path, { blob: true }),
    get: <T>(path: string, signal?: AbortSignal) => execute<T>(path, { signal }),
    post: <T>(path: string, body: unknown, renew = true) => execute<T>(path, { method: 'POST', body, renew }),
    patch: <T>(path: string, body: unknown) => execute<T>(path, { method: 'PATCH', body }),
    delete: <T>(path: string) => execute<T>(path, { method: 'DELETE' }),
};
export const authApi = {
    login: (email: string, password: string, portal: 'admin' | 'user') => http.post<{ destination?: string; mfaRequired?: boolean }>('/api/session/login', { email, password, portal }, false),
    verifyLogin: (code: string) => http.post('/api/session/login/verify', { code }, false),
    logout: () => http.post('/api/session/logout', {}, false),
    verify: (token: string) => http.post('/api/session/verify', { token }, false),
};
