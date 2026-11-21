import { checkOrigin, refreshCookie, endBackendSession, json, clearSession, authFailure } from '@/lib/auth/server';
export async function POST(request: Request) {
    try {
        checkOrigin(request);
    } catch (error) {
        return authFailure(error);
    }
    try {
        const refresh = await refreshCookie();
        if (refresh) await endBackendSession(refresh);
        return clearSession(json({ message: 'Signed out.' }));
    } catch (error) {
        return clearSession(authFailure(error));
    }
}
