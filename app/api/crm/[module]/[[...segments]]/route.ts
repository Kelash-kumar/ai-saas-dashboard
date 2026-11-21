import { crmRequest, crmQuery } from '@/lib/api/crm-server';
import { checkOrigin } from '@/lib/api/server';
import { json, authFailure, AuthError } from '@/lib/auth/server';
type Context = { params: Promise<{ module: string; segments?: string[] }> };
export const GET = (request: Request, context: Context) => handle(request, context, 'GET');
export const POST = (request: Request, context: Context) => handle(request, context, 'POST');
export const PATCH = (request: Request, context: Context) => handle(request, context, 'PATCH');
async function handle(request: Request, context: Context, method: 'GET' | 'POST' | 'PATCH') {
    try {
        if (method !== 'GET') checkOrigin(request);
        const { module, segments = [] } = await context.params;
        if (
            segments.length > 1 ||
            (method === 'PATCH' && !segments.length) ||
            (method === 'POST' && segments.length && segments[0] !== 'bulk') ||
            (method !== 'GET' && segments[0] === 'export') ||
            (method === 'GET' && segments[0] === 'bulk')
        )
            throw new AuthError(405, 'Unsupported operation.');
        let body: unknown;
        if (method !== 'GET') {
            const raw = await request.text();
            if (raw.length > 16384) throw new AuthError(400, 'Form is too large.');
            try {
                body = JSON.parse(raw);
            } catch {
                throw new AuthError(400, 'Invalid form data.');
            }
        }
        const response = await crmRequest(module, method, segments[0], body, crmQuery(Object.fromEntries(new URL(request.url).searchParams)));
        if (segments[0] === 'export')
            return new Response(response.body, {
                headers: {
                    'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
                    'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment',
                    'Cache-Control': 'no-store',
                },
            });
        return json(await response.json());
    } catch (error) {
        return authFailure(error);
    }
}
