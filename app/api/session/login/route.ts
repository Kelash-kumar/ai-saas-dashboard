import { checkOrigin, apiRequest, decodeData, readIdentity, writeSession, json, authFailure, AuthError } from '@/lib/auth/server';
export async function POST(request: Request) {
    try {
        checkOrigin(request);
        const raw = await request.text();
        if (raw.length > 4096) throw new AuthError(400, 'Sign-in data is too large.');
        let input: unknown;
        try {
            input = JSON.parse(raw);
        } catch {
            throw new AuthError(400, 'Enter valid sign-in details.');
        }
        if (!input || typeof input !== 'object') throw new AuthError(400, 'Enter valid sign-in details.');
        const data = input as Record<string, unknown>;
        if (
            (data.portal !== 'admin' && data.portal !== 'user') ||
            typeof data.email !== 'string' ||
            typeof data.password !== 'string' ||
            data.password.length < 1 ||
            data.password.length > 128 ||
            data.email.length > 320
        )
            throw new AuthError(400, 'Enter your email and password.');
        const response = await apiRequest(data.portal === 'admin' ? 'auth/admin/login' : 'auth/login', {
            body: { email: data.email, password: data.password, deviceName: data.portal === 'admin' ? 'Admin web' : 'User web' },
        });
        if (!response.ok)
            throw new AuthError(
                response.status === 429 ? 429 : response.status >= 500 ? 503 : 401,
                response.status === 429
                    ? 'Too many sign-in attempts. Please wait a minute.'
                    : response.status >= 500
                      ? 'The sign-in service is unavailable.'
                      : 'Invalid credentials or account unavailable.',
            );
        const credentials = await decodeData(response);
        if (typeof credentials.accessToken !== 'string') throw new AuthError(502, 'Unexpected session response.');
        const identity = await readIdentity(credentials.accessToken, data.portal, true);
        if (!identity) throw new AuthError(401, 'Account unavailable.');
        return writeSession(json({ destination: '/' }), response, credentials, data.portal);
    } catch (error) {
        return authFailure(error);
    }
}
