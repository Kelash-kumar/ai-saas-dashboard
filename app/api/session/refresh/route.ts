import { cookies } from 'next/headers';
import { checkOrigin, apiRequest, decodeData, readIdentity, writeSession, json, authFailure, AuthError, accessCookie, portalCookie, refreshCookie, clearSession } from '@/lib/auth/server';
export async function POST(request: Request) {
    try {
        checkOrigin(request);
        const jar = await cookies();
        const portal = jar.get(portalCookie)?.value;
        if (portal !== 'admin' && portal !== 'user') throw new AuthError(401, 'Please sign in again.');
        const access = jar.get(accessCookie)?.value;
        if (access && (await readIdentity(access, portal))) return json({ destination: '/' });
        const refresh = await refreshCookie();
        if (!refresh) throw new AuthError(401, 'Please sign in again.');
        const csrfResponse = await apiRequest('auth/csrf', { body: {}, refresh });
        if (!csrfResponse.ok) throw new AuthError(401, 'Please sign in again.');
        const csrf = (await decodeData(csrfResponse)).csrfToken;
        if (typeof csrf !== 'string') throw new AuthError(401, 'Please sign in again.');
        const response = await apiRequest('auth/refresh', { body: {}, refresh, csrf });
        if (!response.ok) throw new AuthError(response.status === 429 ? 429 : response.status >= 500 ? 503 : 401, 'Your session could not be renewed. Please sign in again.');
        const credentials = await decodeData(response);
        if (typeof credentials.accessToken !== 'string' || !(await readIdentity(credentials.accessToken, portal))) throw new AuthError(401, 'Please sign in again.');
        return writeSession(json({ destination: '/' }), response, credentials, portal);
    } catch (error) {
        const result = authFailure(error);
        return error instanceof AuthError && [401, 403].includes(error.status) ? clearSession(result) : result;
    }
}
