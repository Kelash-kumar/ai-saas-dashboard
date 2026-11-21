import { cookies } from 'next/headers';
import { challengeCookie, secure, checkOrigin, apiRequest, decodeData, readIdentity, writeSession, json, authFailure, AuthError } from '@/lib/auth/server';
export async function POST(request: Request) {
    try {
        checkOrigin(request);
        const raw = await request.text();
        if (raw.length > 128) throw new AuthError(400, 'Invalid code.');
        let input: unknown;
        try {
            input = JSON.parse(raw);
        } catch {
            throw new AuthError(400, 'Invalid code.');
        }
        if (!input || typeof input !== 'object' || !('code' in input) || typeof input.code !== 'string' || !/^\d{6}$/.test(input.code)) throw new AuthError(400, 'Enter the six-digit code.');
        const pending = (await cookies()).get(challengeCookie)?.value ?? '';
        const match = /^([A-Za-z0-9_-]{43})\.(admin|user)$/.exec(pending);
        if (!match) throw new AuthError(401, 'Start sign-in again.');
        const response = await apiRequest('auth/login/verify', { body: { challengeToken: match[1], code: input.code } });
        if (!response.ok) throw new AuthError(response.status === 429 ? 429 : response.status >= 500 ? 503 : 401, 'Code is invalid, expired or unavailable. Try again or restart sign-in.');
        const data = await decodeData(response),
            portal = match[2] === 'admin' ? 'admin' : 'user';
        if (typeof data.accessToken !== 'string' || !(await readIdentity(data.accessToken, portal, true))) throw new AuthError(401, 'Account unavailable.');
        const result = writeSession(json({ destination: '/' }), response, data, portal);
        result.cookies.set(challengeCookie, '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 });
        return result;
    } catch (error) {
        return authFailure(error);
    }
}
