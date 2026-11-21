import { moduleRequest, listQuery } from '@/lib/api/modules-server';
import { checkOrigin } from '@/lib/api/server';
import { authFailure, json, AuthError } from '@/lib/auth/server';
export async function GET(request: Request, context: { params: Promise<{ module: string; id?: string[] }> }) {
    return handle(request, context, 'GET');
}
export async function POST(request: Request, context: { params: Promise<{ module: string; id?: string[] }> }) {
    return handle(request, context, 'POST');
}
export async function PATCH(request: Request, context: { params: Promise<{ module: string; id?: string[] }> }) {
    return handle(request, context, 'PATCH');
}
export async function DELETE(request: Request, context: { params: Promise<{ module: string; id?: string[] }> }) {
    return handle(request, context, 'DELETE');
}
async function handle(request: Request, context: { params: Promise<{ module: string; id?: string[] }> }, method: 'GET' | 'POST' | 'PATCH' | 'DELETE') {
    try {
        if (method !== 'GET') checkOrigin(request);
        const { module, id } = await context.params;
        if ((id?.length ?? 0) > 1) throw new AuthError(404, 'Record not found.');
        if (method === 'POST' && id?.length) throw new AuthError(405, 'Unsupported operation.');
        if (['PATCH', 'DELETE'].includes(method) && !id?.length) throw new AuthError(400, 'Record identifier required.');
        let body: unknown;
        if (method === 'POST' || method === 'PATCH') {
            const raw = await request.text();
            if (raw.length > 16384) throw new AuthError(400, 'Form is too large.');
            try {
                body = JSON.parse(raw);
            } catch {
                throw new AuthError(400, 'Invalid JSON form data.');
            }
        }
        const response = await moduleRequest(module, method, id?.[0], body, listQuery(Object.fromEntries(new URL(request.url).searchParams)));
        return response.status === 204 ? new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }) : json(await response.json());
    } catch (error) {
        return authFailure(error);
    }
}
