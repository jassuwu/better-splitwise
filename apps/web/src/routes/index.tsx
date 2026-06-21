import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { displayName, netBalance } from '../lib/format';
import { login, logout, useFriends, useGroups, useMe } from '../lib/queries';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const me = useMe();
  if (me.isLoading) return <Centered>Loading…</Centered>;
  if (me.isError || !me.data) return <KeyEntry />;
  return <Dashboard />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-5 text-mut">{children}</div>;
}

function KeyEntry() {
  const qc = useQueryClient();
  const [key, setKey] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const user = await login(key.trim());
      // seed the cache directly — don't rely on invalidate→refetch flipping an errored query
      qc.setQueryData(['me'], user);
      void qc.invalidateQueries({ queryKey: ['groups'] });
      void qc.invalidateQueries({ queryKey: ['friends'] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-brand">better</span> splitwise
        </h1>
        <p className="mt-2 text-sm text-mut">
          Sign in with your Splitwise API key. It's kept in a secure, http-only cookie — never in the browser.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="splitwise api key"
          className="mt-5 w-full rounded-xl border border-line bg-card2 px-4 py-3 outline-none focus:border-brand"
        />
        {err ? <p className="mt-2 text-sm text-neg">{err}</p> : null}
        <button
          onClick={submit}
          disabled={busy || !key.trim()}
          className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-black transition disabled:opacity-40">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs text-dim">
          get a key at{' '}
          <a className="text-brand underline" href="https://secure.splitwise.com/apps" target="_blank" rel="noreferrer">
            secure.splitwise.com/apps
          </a>
        </p>
      </div>
    </Centered>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const me = useMe();
  const friends = useFriends();
  const groups = useGroups();
  const meId = me.data?.id;

  const overall = (friends.data ?? []).flatMap((f) => f.balance ?? []).reduce((s, b) => s + Number(b.amount), 0);
  const currency = me.data?.default_currency ?? '';
  const settled = Math.abs(overall) < 0.005;

  const people = [...(friends.data ?? [])]
    .map((f) => ({ id: f.id, name: displayName(f), net: netBalance(f.balance) }))
    .filter((x) => Math.abs(x.net.amount) > 0.005)
    .sort((a, b) => Math.abs(b.net.amount) - Math.abs(a.net.amount));
  const groupRows = [...(groups.data ?? [])]
    .map((g) => ({ id: g.id, name: g.name, net: netBalance(g.members.find((m) => m.id === meId)?.balance) }))
    .sort((a, b) => Math.abs(b.net.amount) - Math.abs(a.net.amount));

  async function signOut() {
    await logout();
    qc.clear();
    await qc.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          <span className="text-brand">better</span> splitwise
        </h1>
        <button onClick={signOut} className="text-sm text-mut transition hover:text-ink">
          Sign out
        </button>
      </header>

      <section className="mt-10 text-center">
        <p className="text-sm text-mut">
          {settled ? "You're all settled up" : overall > 0 ? 'You are owed, overall' : 'You owe, overall'}
        </p>
        <p
          className="mt-2 text-5xl font-bold tabular-nums"
          style={{ color: settled ? 'var(--color-mut)' : overall > 0 ? 'var(--color-pos)' : 'var(--color-neg)' }}>
          {currency ? `${currency} ` : ''}
          {Math.abs(overall).toFixed(2)}
        </p>
      </section>

      <div className="mt-7">
        <Link
          to="/add"
          className="block w-full rounded-xl bg-brand py-3 text-center font-semibold text-black transition hover:opacity-90">
          Add an expense
        </Link>
      </div>

      {friends.isLoading || groups.isLoading ? <p className="mt-8 text-center text-sm text-mut">Loading balances…</p> : null}

      {people.length ? (
        <Group title="People">
          {people.map((p) => (
            <BalanceRow key={p.id} name={p.name} sub={p.net.amount > 0 ? 'owes you' : 'you owe'} net={p.net} />
          ))}
        </Group>
      ) : null}

      {groupRows.length ? (
        <Group title="Groups">
          {groupRows.map((g) => (
            <BalanceRow key={g.id} name={g.name} net={g.net} />
          ))}
        </Group>
      ) : null}

      {!people.length && !groupRows.length && !friends.isLoading ? (
        <p className="mt-10 text-center text-sm text-mut">No balances — you're all settled up.</p>
      ) : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="px-1 pb-2 text-xs uppercase tracking-wider text-dim">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">{children}</div>
    </div>
  );
}

function BalanceRow({ name, sub, net }: { name: string; sub?: string; net: { amount: number; currency: string } }) {
  const settled = Math.abs(net.amount) < 0.005;
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-card2 text-sm font-semibold text-brand">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-[15px]">{name}</p>
        {sub ? <p className="text-xs text-mut">{sub}</p> : null}
      </div>
      <p
        className="tabular-nums text-[15px]"
        style={{ color: settled ? 'var(--color-mut)' : net.amount > 0 ? 'var(--color-pos)' : 'var(--color-neg)' }}>
        {net.amount < 0 ? '-' : ''}
        {net.currency ? `${net.currency} ` : ''}
        {Math.abs(net.amount).toFixed(2)}
      </p>
    </div>
  );
}
