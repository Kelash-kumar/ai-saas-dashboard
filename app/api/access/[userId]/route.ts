import { accessRequest } from '@/lib/api/access-server';
import { checkOrigin } from '@/lib/api/server';
import { authFailure, json, AuthError } from '@/lib/auth/server';
export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        return json(await (await accessRequest((await context.params).userId)).json());
    } catch (error) {
        return authFailure(error);
    }
}
export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        checkOrigin(request);
        const raw = await request.text();
        if (raw.length > 2048) throw new AuthError(400, 'Invalid change.');
        let body: unknown;
        try {
            body = JSON.parse(raw);
        } catch {
            throw new AuthError(400, 'Invalid change.');
        }
        if (
            !body ||
            typeof body !== 'object' ||
            !('kind' in body) ||
            (body.kind !== 'role' && body.kind !== 'permission') ||
            !('id' in body) ||
            typeof body.id !== 'string' ||
            !('grant' in body) ||
            typeof body.grant !== 'boolean'
        )
            throw new AuthError(400, 'Invalid change.');
        await accessRequest((await context.params).userId, { kind: body.kind, id: body.id, grant: body.grant });
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        return authFailure(error);
    }
}
