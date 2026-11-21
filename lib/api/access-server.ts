import 'server-only';
import { cookies } from 'next/headers';
import { apiRequest, backendFailure } from './server';
import { accessCookie } from '@/lib/auth/server';
import { requireApiSession } from '@/lib/auth/authorization';
import { ApiError } from './errors';
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export interface UserAccess {
    roleIds: string[];
    roles: string[];
    permissions: string[];
    directRoleIds: string[];
    directPermissionIds: string[];
}
export async function accessRequest(userId: string, change?: { kind: 'role' | 'permission'; id: string; grant: boolean }) {
    if (!uuid.test(userId) || (change && !uuid.test(change.id))) throw new ApiError(400, 'Invalid identifier.');
    const permission = change ? (change.kind === 'role' ? 'roles.assign' : change.grant ? 'permissions.assign' : 'permissions.revoke') : 'users.read';
    await requireApiSession([permission]);
    const path = 'authorization/users/' + userId + (change ? '/' + (change.kind === 'role' ? 'roles' : 'permissions') + '/' + change.id : '/authority');
    const response = await apiRequest(path, { access: (await cookies()).get(accessCookie)?.value, method: change ? (change.grant ? 'POST' : 'DELETE') : 'GET' });
    if (!response.ok) await backendFailure(response);
    return response;
}
export async function userAccess(userId: string): Promise<UserAccess> {
    return await (await accessRequest(userId)).json().then((value) => (value as { data: UserAccess }).data);
}
