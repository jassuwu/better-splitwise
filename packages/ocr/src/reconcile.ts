import { toCents } from "@repo/split-core";
import type { Receipt } from "@repo/split-core";

export interface ReceiptReconciliation {
  itemsSubtotalCents: number;
  feesCents: number;
  /** items + fees, in cents. */
  computedTotalCents: number;
  /** the receipt's own stated grand total, in cents. */
  declaredTotalCents: number;
  /** computedTotalCents - declaredTotalCents. Non-zero means the OCR likely missed or misread something. */
  deltaCents: number;
  ok: boolean;
}

function centsOr(value: number | undefined): number {
  return value === undefined ? 0 : toCents(value);
}

/**
 * Sanity-check an extracted receipt against its own stated total. Constrained
 * decoding guarantees JSON *shape*, never the *values*, so the UI must never
 * trust a model total blindly — if `ok` is false, prompt the human to fix it.
 */
export function reconcileReceipt(receipt: Receipt, toleranceCents = 0): ReceiptReconciliation {
  const itemsSubtotalCents = receipt.items.reduce((sum, item) => sum + toCents(item.total), 0);
  const feesCents =
    centsOr(receipt.tax) + centsOr(receipt.tip) + centsOr(receipt.service) + centsOr(receipt.fees);
  const computedTotalCents = itemsSubtotalCents + feesCents;
  const declaredTotalCents = toCents(receipt.total);
  const deltaCents = computedTotalCents - declaredTotalCents;
  return {
    itemsSubtotalCents,
    feesCents,
    computedTotalCents,
    declaredTotalCents,
    deltaCents,
    ok: Math.abs(deltaCents) <= toleranceCents,
  };
}
