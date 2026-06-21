import { createFileRoute } from '@tanstack/react-router';

const BASE = 'https://secure.splitwise.com/api/v3.0';

function tokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)sw_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }): Promise<Response> {
  const token = tokenFromCookie(request) ?? process.env.SPLITWISE_TOKEN;
  if (!token) return Response.json({ error: 'not authenticated' }, { status: 401 });

  const target = `${BASE}/${params._splat ?? ''}${new URL(request.url).search}`;
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const headers = new Headers();
  headers.set('authorization', `Bearer ${token}`);
  const ct = request.headers.get('content-type');
  if (ct) headers.set('content-type', ct);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export const Route = createFileRoute('/api/splitwise/$')({
  server: {
    handlers: { GET: proxy, POST: proxy, PUT: proxy, PATCH: proxy, DELETE: proxy },
  },
});
