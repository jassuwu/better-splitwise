import { computeSplit, toCents, type SplitResult } from '@repo/split-core';

/** Parse a typed decimal string (system keypad) to integer cents; 0 on junk. */
export function amountToCents(s: string): number {
  const cleaned = s.replace(/,/g, ''); // tolerate grouped input ("1,200.50")
  if (!cleaned || cleaned === '.' || cleaned === '0.') return 0;
  try {
    return toCents(cleaned.endsWith('.') ? cleaned.slice(0, -1) : cleaned);
  } catch {
    return 0;
  }
}

function group(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Integer-safe cents → "1,200.50". */
export function centsToMoney(cents: number): string {
  const whole = Math.floor(cents / 100);
  const c = cents % 100;
  return `${group(String(whole))}.${String(c).padStart(2, '0')}`;
}

/**
 * The live split. Locked people become 1-person line items; everyone else shares
 * the remainder equally — computeSplit then guarantees the per-person amounts sum
 * exactly to the total. Returns null (with overBy > 0) when locks exceed the total.
 */
export function buildSplit(opts: {
  currency: string;
  includedIds: string[];
  totalCents: number;
  overrides: Record<string, number>;
}): { result: SplitResult | null; overBy: number; underBy: number } {
  const { currency, includedIds, totalCents, overrides } = opts;
  const locked = includedIds.filter((id) => overrides[id] !== undefined);
  const lockedSum = locked.reduce((sum, id) => sum + (overrides[id] ?? 0), 0);
  const free = includedIds.filter((id) => overrides[id] === undefined);
  const remainder = totalCents - lockedSum;

  if (lockedSum > totalCents) return { result: null, overBy: lockedSum - totalCents, underBy: 0 };
  if (includedIds.length === 0 || totalCents <= 0) return { result: null, overBy: 0, underBy: 0 };
  // everyone is locked but the locks don't add up to the total
  if (free.length === 0 && remainder !== 0) return { result: null, overBy: 0, underBy: remainder > 0 ? remainder : 0 };

  const items = [
    ...locked.map((id) => ({ id: `lock-${id}`, label: 'share', total: overrides[id] as number, assignees: [id] })),
    ...(remainder > 0 && free.length > 0 ? [{ id: 'rest', label: 'split', total: remainder, assignees: free }] : []),
  ];
  try {
    return { result: computeSplit({ currency, people: includedIds, items }), overBy: 0, underBy: 0 };
  } catch {
    return { result: null, overBy: 0, underBy: 0 };
  }
}
