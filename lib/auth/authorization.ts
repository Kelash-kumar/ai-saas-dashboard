import 'server-only';
import { currentSession, AuthError } from './server';
import { hasPermissions } from './permissions';
export async function requireApiSession(required: readonly string[] = []) {
    const session = await currentSession();
    if (!session) throw new AuthError(401, 'Please sign in again.');
    if (!hasPermissions(session.permissions, required)) throw new AuthError(403, 'Your account does not have permission for this action.');
    return session;
}
