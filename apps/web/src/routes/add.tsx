import { computeSplit, toCents } from '@repo/split-core';
import { toCreateExpenseParams } from '@repo/splitwise';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { firstName } from '../lib/format';
import { useCreateExpense, useGroups, useMe } from '../lib/queries';

export const Route = createFileRoute('/add')({ component: AddPage });

function AddPage() {
  const me = useMe();
  const groups = useGroups();
  const create = useCreateExpense();
  const navigate = useNavigate();
  const meId = me.data?.id;

  const [groupId, setGroupId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (groupId === null && groups.data?.length) setGroupId(groups.data[0]!.id);
  }, [groups.data, groupId]);

  if (!me.isLoading && (me.isError || !me.data)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-mut">
        <p>
          Please{' '}
          <a className="text-brand underline" href="/">
            sign in
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const group = groups.data?.find((g) => g.id === groupId) ?? null;
  const currency = me.data?.default_currency ?? 'USD';

  function submit() {
    setErr(null);
    if (!group || meId == null) {
      setErr('Pick a group.');
      return;
    }
    let cents: number;
    try {
      cents = toCents(amount);
    } catch {
      setErr('Enter a valid amount.');
      return;
    }
    if (cents <= 0) {
      setErr('Enter a valid amount.');
      return;
    }
    const memberIds = group.members.map((m) => String(m.id));
    const split = computeSplit({
      currency,
      people: memberIds,
      items: [{ id: 'x', label: desc || 'expense', total: cents, assignees: memberIds }],
    });
    const userIds = Object.fromEntries(group.members.map((m) => [String(m.id), m.id]));
    const params = toCreateExpenseParams(split, {
      groupId: group.id,
      description: desc || 'expense',
      payerId: String(meId),
      userIds,
      currencyCode: currency,
    });
    create.mutate(params, {
      onSuccess: () => navigate({ to: '/' }),
      onError: (e) => setErr(e instanceof Error ? e.message : 'Could not add the expense.'),
    });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <a href="/" className="text-sm text-mut transition hover:text-ink">
        ← back
      </a>
      <h1 className="mt-4 text-xl font-semibold">Add an expense</h1>
      <p className="mt-1 text-sm text-mut">Split equally across the group. (Custom &amp; itemized splits are coming to web next.)</p>

      <label className="mt-6 block text-xs uppercase tracking-wider text-dim">Group</label>
      <select
        value={groupId ?? ''}
        onChange={(e) => setGroupId(Number(e.target.value))}
        className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 outline-none focus:border-brand">
        {(groups.data ?? []).map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <label className="mt-5 block text-xs uppercase tracking-wider text-dim">Amount ({currency})</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="0.00"
        className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 text-2xl font-semibold tabular-nums outline-none focus:border-brand"
      />

      <label className="mt-5 block text-xs uppercase tracking-wider text-dim">What for</label>
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="dinner, groceries…"
        className="mt-2 w-full rounded-xl border border-line bg-card2 px-4 py-3 outline-none focus:border-brand"
      />

      {group ? (
        <p className="mt-5 text-sm text-mut">
          You paid · split equally among {group.members.length}
          {group.members.length === 1 ? ' person' : ' people'}
          {group.members.length <= 6 ? ` (${group.members.map((m) => (m.id === meId ? 'you' : firstName(m))).join(', ')})` : ''}
          .
        </p>
      ) : null}

      {err ? <p className="mt-4 text-sm text-neg">{err}</p> : null}

      <button
        onClick={submit}
        disabled={create.isPending || !group || !amount.trim()}
        className="mt-6 w-full rounded-xl bg-brand py-3 font-semibold text-black transition disabled:opacity-40">
        {create.isPending ? 'Adding…' : 'Add expense'}
      </button>
    </div>
  );
}
