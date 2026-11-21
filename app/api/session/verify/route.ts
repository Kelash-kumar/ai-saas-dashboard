import { apiRequest, checkOrigin } from '@/lib/api/server';
import { authFailure, json, AuthError } from '@/lib/auth/server';
export async function POST(request: Request) {
    try {
        checkOrigin(request);
        const raw = await request.text();
        if (raw.length > 512) throw new AuthError(400, 'Invalid verification token.');
        let value: unknown;
        try {
            value = JSON.parse(raw);
        } catch {
            throw new AuthError(400, 'Invalid verification token.');
        }
        if (!value || typeof value !== 'object' || !('token' in value) || typeof value.token !== 'string' || !/^[-_a-zA-Z0-9]{43}$/.test(value.token))
            throw new AuthError(400, 'Invalid verification token.');
        const response = await apiRequest('auth/verify-email', { body: { token: value.token } });
        if (!response.ok) throw new AuthError(response.status >= 500 ? 503 : 400, 'Verification failed. The token may be expired or already used.');
        return json({ message: 'Email verified. You can now sign in.' });
    } catch (error) {
        return authFailure(error);
    }
}
