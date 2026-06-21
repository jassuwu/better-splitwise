import type { Balance, Friend, Group } from "./types";

export interface PairDebt {
  /** Owes the creditor. */
  debtorId: number;
  /** Is owed by the debtor. */
  creditorId: number;
  /** Positive decimal string. */
  amount: string;
  currencyCode: string;
}

/**
 * The debt between `meId` and `otherId` in a group, or null when settled.
 * Reads simplified_debts unless the group is configured not to simplify, in
 * which case it reads original_debts — match whichever the user sees.
 */
export function debtBetween(group: Group, meId: number, otherId: number): PairDebt | null {
  const debts =
    group.simplify_by_default === false
      ? (group.original_debts ?? group.simplified_debts)
      : (group.simplified_debts ?? group.original_debts);
  const d = (debts ?? []).find(
    (x) => (x.from === meId && x.to === otherId) || (x.from === otherId && x.to === meId),
  );
  if (!d) return null;
  return { debtorId: d.from, creditorId: d.to, amount: d.amount, currencyCode: d.currency_code };
}

/** Net balance with a member, signed from my perspective (+ = they owe me; null = settled). */
export function netWithMember(
  group: Group,
  meId: number,
  otherId: number,
): { amount: number; currencyCode: string } | null {
  const d = debtBetween(group, meId, otherId);
  if (!d) return null;
  const signed = Number(d.amount) * (d.creditorId === meId ? 1 : -1);
  return { amount: signed, currencyCode: d.currencyCode };
}

/** Per-group balance with a friend from get_friends (group_id 0 = non-group). +amount = friend owes me. */
export function friendGroupBalance(friend: Friend, groupId: number): Balance | null {
  return friend.groups?.find((g) => g.group_id === groupId)?.balance?.[0] ?? null;
}
