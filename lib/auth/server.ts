import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import type { Principal, Portal, SessionView } from './types';
import { loginPath } from './types';
import { serverConfig } from '@/config/server';
import { ApiError as AuthError } from '@/lib/api/errors';
import { apiRequest, decodeData } from '@/lib/api/server';
export { apiRequest, decodeData, checkOrigin } from '@/lib/api/server';
export { ApiError as AuthError } from '@/lib/api/errors';
export const secure = serverConfig.secure;
const refreshName = serverConfig.refreshName;
export const accessCookie = secure ? '__Host-foundation_access' : 'foundation_access';
export const portalCookie = secure ? '__Host-foundation_portal' : 'foundation_portal';
export const challengeCookie = secure ? '__Host-foundation_challenge' : 'foundation_challenge';
export async function readIdentity(access: string, portal: Portal, enforceAdmin = false): Promise<SessionView | null> {
    const response = await apiRequest('auth/me', { access });
    if (response.status === 401) return null;
    if (!response.ok) throw new AuthError(response.status >= 500 ? 503 : response.status, 'Could not validate this session.');
    const data = await decodeData(response);
    if (typeof data.userId !== 'string' || typeof data.sessionId !== 'string' || typeof data.email !== 'string' || typeof data.userType !== 'string')
        throw new AuthError(502, 'Unexpected identity response.');
    const principal: Principal = { userId: data.userId, sessionId: data.sessionId, email: data.email, userType: data.userType };
    principal.firstName = typeof data.firstName === 'string' ? data.firstName : null;
    principal.lastName = typeof data.lastName === 'string' ? data.lastName : null;
    principal.avatarData =
        typeof data.avatarData === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data.avatarData) && data.avatarData.length <= 8000 ? data.avatarData : null;
    const authority = await apiRequest('authorization/me', { access });
    if (authority.status === 401) return null;
    if (!authority.ok) throw new AuthError(503, 'Could not check account access.');
    const granted = await decodeData(authority);
    const permissions = Array.isArray(granted.permissions) ? granted.permissions.filter((item): item is string => typeof item === 'string') : [];
    if (enforceAdmin && portal === 'admin' && !permissions.includes('admin.access')) throw new AuthError(403, 'Your account does not have admin access.');
    return { principal, permissions, roles: Array.isArray(granted.roles) ? granted.roles.filter((item): item is string => typeof item === 'string') : [], portal };
}
async function loadRequiredSession(): Promise<SessionView> {
    const jar = await cookies();
    const portal: Portal = jar.get(portalCookie)?.value === 'admin' ? 'admin' : 'user';
    const access = jar.get(accessCookie)?.value;
    if (!access) {
        if (jar.has(refreshName)) redirect('/session/renew?portal=' + portal);
        redirect(loginPath());
    }
    let session: SessionView | null;
    try {
        session = await currentSession();
    } catch (error) {
        if (error instanceof AuthError && error.status === 403) redirect(loginPath() + '?reason=access');
        throw error;
    }
    if (!session) {
        if (jar.has(refreshName)) redirect('/session/renew?portal=' + portal);
        redirect(loginPath());
    }
    return session;
}
export const requireSession = cache(loadRequiredSession);
export function json(data: unknown, status = 200) {
    return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}
export function authFailure(error: unknown) {
    return json({ message: error instanceof AuthError ? error.message : 'Unable to complete sign-in.' }, error instanceof AuthError ? error.status : 500);
}
export function clearSession(response: NextResponse) {
    for (const name of [accessCookie, portalCookie, refreshName, challengeCookie]) response.cookies.set(name, '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 });
    return response;
}
export function writeSession(response: NextResponse, backend: Response, data: Record<string, unknown>, portal: Portal) {
    if (typeof data.accessToken !== 'string' || typeof data.expiresIn !== 'number' || data.expiresIn < 1) throw new AuthError(502, 'Unexpected session response.');
    response.cookies.set(accessCookie, data.accessToken, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: Math.min(data.expiresIn, 900) });
    response.cookies.set(portalCookie, portal, { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 604800 });
    for (const cookie of backend.headers.getSetCookie()) if (cookie.startsWith(refreshName + '=')) response.headers.append('Set-Cookie', cookie);
    return response;
}
export async function refreshCookie() {
    return (await cookies()).get(refreshName)?.value;
}
export async function endBackendSession(refresh: string) {
    const csrf = await apiRequest('auth/csrf', { body: {}, refresh });
    if (!csrf.ok) {
        if (csrf.status === 401) return;
        throw new AuthError(503, 'Server sign-out could not be completed.');
    }
    const token = (await decodeData(csrf)).csrfToken;
    if (typeof token !== 'string') throw new AuthError(502, 'Unexpected sign-out response.');
    const result = await apiRequest('auth/logout', { body: {}, refresh, csrf: token });
    if (!result.ok && result.status !== 401) throw new AuthError(503, 'Server sign-out could not be completed.');
}

async function loadCurrentSession(): Promise<SessionView | null> {
    const jar = await cookies();
    const access = jar.get(accessCookie)?.value;
    if (!access) return null;
    try {
        return await readIdentity(access, jar.get(portalCookie)?.value === 'admin' ? 'admin' : 'user');
    } catch (error) {
        if (error instanceof AuthError && [401, 403].includes(error.status)) return null;
        throw error;
    }
}

export const currentSession = cache(loadCurrentSession);
