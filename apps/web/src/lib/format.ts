import type { Balance, SplitwiseUser } from '@repo/splitwise';

export function netBalance(balances?: Balance[]): { amount: number; currency: string } {
  const list = balances ?? [];
  const amount = list.reduce((s, b) => s + Number(b.amount), 0);
  return { amount, currency: list[0]?.currency_code ?? '' };
}

export function displayName(u?: SplitwiseUser | null): string {
  if (!u) return 'Someone';
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Someone';
}

export function firstName(u?: SplitwiseUser | null): string {
  return u?.first_name || displayName(u);
}

export function money(amount: number, currency: string): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency ? `${currency} ` : ''}${Math.abs(amount).toFixed(2)}`;
}
