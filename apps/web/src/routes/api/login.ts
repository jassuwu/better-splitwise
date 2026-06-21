import { createFileRoute } from '@tanstack/react-router';

const BASE = 'https://secure.splitwise.com/api/v3.0';

export const Route = createFileRoute('/api/login')({
  server: {
    handlers: {
      // validate the key against Splitwise, then stash it in an http-only cookie
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => ({}))) as { key?: string };
        const key = body.key?.trim();
        if (!key) return Response.json({ error: 'missing key' }, { status: 400 });

        const res = await fetch(`${BASE}/get_current_user`, { headers: { authorization: `Bearer ${key}` } });
        if (!res.ok) return Response.json({ error: 'invalid key' }, { status: 401 });
        const data = (await res.json()) as { user?: unknown };

        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const cookie = `sw_token=${encodeURIComponent(key)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
        return new Response(JSON.stringify(data.user ?? {}), {
          status: 200,
          headers: { 'content-type': 'application/json', 'set-cookie': cookie },
        });
      },
      DELETE: async () =>
        new Response(null, { status: 204, headers: { 'set-cookie': 'sw_token=; HttpOnly; Path=/; Max-Age=0' } }),
    },
  },
});
