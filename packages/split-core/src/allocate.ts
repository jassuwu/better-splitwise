import type { Cents } from "./money";

/**
 * Distribute `amount` (integer cents) across parties in proportion to
 * `weights`, using the largest-remainder (Hamilton) method so the returned
 * shares are integers that sum EXACTLY to `amount`. Ties in the fractional
 * remainder are broken by original index, so the result is deterministic.
 *
 * This exactness is the load-bearing property for Splitwise: the per-person
 * `owed_share` values must sum to the expense cost or the API rejects them.
 */
export function allocateByWeights(amount: Cents, weights: readonly number[]): Cents[] {
  if (!Number.isInteger(amount)) {
    throw new Error(`allocateByWeights: amount must be integer cents, got ${amount}`);
  }
  if (amount < 0) {
    throw new Error(`allocateByWeights: amount must be >= 0, got ${amount}`);
  }
  const n = weights.length;
  if (n === 0) {
    if (amount !== 0) {
      throw new Error("allocateByWeights: cannot allocate a non-zero amount to zero parties");
    }
    return [];
  }
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new Error("allocateByWeights: weights must be finite and >= 0");
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  // If every weight is zero, fall back to an equal split.
  const w = totalWeight === 0 ? weights.map(() => 1) : weights;
  const wTotal = totalWeight === 0 ? n : totalWeight;

  const exact = w.map((wi) => (amount * wi) / wTotal);
  const shares = exact.map((x) => Math.floor(x));
  let remainder = amount - shares.reduce((a, b) => a + b, 0);

  // Hand out the leftover cents to the largest fractional remainders first.
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  for (const { i } of order) {
    if (remainder <= 0) break;
    shares[i] = (shares[i] ?? 0) + 1;
    remainder -= 1;
  }
  return shares;
}

/** Split `amount` (integer cents) into `n` equal-as-possible integer shares. */
export function allocateEqually(amount: Cents, n: number): Cents[] {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`allocateEqually: n must be a non-negative integer, got ${n}`);
  }
  return allocateByWeights(amount, Array.from({ length: n }, () => 1));
}
