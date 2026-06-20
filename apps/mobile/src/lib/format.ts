import type { Balance, SplitwiseUser } from '@repo/splitwise';

export function displayName(user: Pick<SplitwiseUser, 'id' | 'first_name' | 'last_name'>): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || `user ${user.id}`;
}

export function firstName(user: Pick<SplitwiseUser, 'id' | 'first_name'>): string {
  return user.first_name?.trim() || `user ${user.id}`;
}

export function avatarUri(user: Pick<SplitwiseUser, 'picture'> | null | undefined): string | null {
  return user?.picture?.medium ?? user?.picture?.large ?? user?.picture?.small ?? null;
}

/**
 * Collapse a Splitwise balance array into a single signed amount + currency.
 * Most users transact in one currency; we sum amounts and label with the first.
 */
export function netBalance(balances: Balance[] | undefined): { amount: number; currency: string } {
  if (!balances || balances.length === 0) return { amount: 0, currency: '' };
  const amount = balances.reduce((sum, b) => sum + Number(b.amount), 0);
  return { amount, currency: balances[0].currency_code };
}

/** "you are owed" (green) / "you owe" (red) / "settled up" from a signed net amount. */
export function balanceLabel(amount: number): { text: string; color: string } {
  if (Math.abs(amount) < 0.005) return { text: 'settled up', color: '#8a8f98' };
  if (amount > 0) return { text: 'you are owed', color: '#30a46c' };
  return { text: 'you owe', color: '#e5484d' };
}

export function money(amount: number, currency: string): string {
  return `${currency ? currency + ' ' : ''}${Math.abs(amount).toFixed(2)}`;
}
