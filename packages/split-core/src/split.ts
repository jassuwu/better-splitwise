import { allocateByWeights, allocateEqually } from "./allocate";
import type { Cents } from "./money";

export type PersonId = string;
export type FeeStrategy = "proportional" | "equal";

export interface LineItem {
  readonly id: string;
  readonly label: string;
  /** Line total in integer cents (quantity * unit price). */
  readonly total: Cents;
  /** People sharing this item. Must be non-empty and a subset of `people`. */
  readonly assignees: readonly PersonId[];
  /** Optional per-assignee weights (same length as `assignees`); defaults to equal. */
  readonly weights?: readonly number[];
}

export interface SplitInput {
  readonly people: readonly PersonId[];
  readonly items: readonly LineItem[];
  readonly tax?: Cents;
  readonly tip?: Cents;
  readonly service?: Cents;
  readonly otherFees?: Cents;
  readonly feeStrategy?: Partial<Record<"tax" | "tip" | "service" | "other", FeeStrategy>>;
  /** OCR-declared grand total, in cents, used only for reconciliation. */
  readonly declaredTotal?: Cents;
  readonly currency: string;
}

export interface PersonShare {
  readonly personId: PersonId;
  readonly subtotal: Cents;
  readonly tax: Cents;
  readonly tip: Cents;
  readonly service: Cents;
  readonly other: Cents;
  /** Everything this person owes = subtotal + every fee share. */
  readonly owed: Cents;
}

export interface SplitResult {
  readonly currency: string;
  readonly perPerson: readonly PersonShare[];
  readonly subtotal: Cents;
  readonly tax: Cents;
  readonly tip: Cents;
  readonly service: Cents;
  readonly other: Cents;
  /** Computed grand total = sum of every person's `owed`. Push this as the Splitwise expense cost. */
  readonly total: Cents;
  readonly reconciliation: {
    readonly declaredTotal?: Cents;
    readonly computedTotal: Cents;
    /** null when no declaredTotal was provided. */
    readonly matchesDeclared: boolean | null;
    /** computedTotal - declaredTotal (cents); undefined when no declaredTotal. */
    readonly deltaFromDeclared?: Cents;
  };
}

function assertCents(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer (cents), got ${value}`);
  }
}

/**
 * Compute a per-person split from item assignments and shared fees.
 *
 * Guarantees, by construction:
 *  - every fee's per-person shares sum exactly to that fee,
 *  - the per-person `owed` values sum exactly to `total`,
 *  - `total === subtotal + tax + tip + service + other`.
 *
 * Tax/tip/service/other default to a split proportional to each person's
 * item subtotal; set `feeStrategy` to split any of them equally instead
 * (e.g. `{ tip: "equal" }`).
 */
export function computeSplit(input: SplitInput): SplitResult {
  const { people, items } = input;
  if (people.length === 0) throw new Error("computeSplit: `people` must be non-empty");
  if (new Set(people).size !== people.length) {
    throw new Error("computeSplit: `people` must be unique");
  }
  const index = new Map<PersonId, number>(people.map((p, i) => [p, i]));
  const n = people.length;
  const subtotalShares = Array.from({ length: n }, () => 0);

  for (const item of items) {
    assertCents(item.total, `item "${item.id}".total`);
    if (item.assignees.length === 0) {
      throw new Error(`computeSplit: item "${item.id}" has no assignees`);
    }
    if (item.weights && item.weights.length !== item.assignees.length) {
      throw new Error(`computeSplit: item "${item.id}" weights length must match assignees`);
    }
    const positions = item.assignees.map((p) => {
      const pos = index.get(p);
      if (pos === undefined) {
        throw new Error(`computeSplit: item "${item.id}" assignee "${p}" is not in people`);
      }
      return pos;
    });
    const weights = item.weights ?? item.assignees.map(() => 1);
    const itemShares = allocateByWeights(item.total, weights);
    itemShares.forEach((cents, k) => {
      const pos = positions[k];
      if (pos === undefined) return;
      subtotalShares[pos] = (subtotalShares[pos] ?? 0) + cents;
    });
  }

  const allocateFee = (amount: Cents | undefined, strategy: FeeStrategy): Cents[] => {
    if (!amount) return Array.from({ length: n }, () => 0);
    assertCents(amount, "fee");
    return strategy === "equal"
      ? allocateEqually(amount, n)
      : allocateByWeights(amount, subtotalShares);
  };

  const taxShares = allocateFee(input.tax, input.feeStrategy?.tax ?? "proportional");
  const tipShares = allocateFee(input.tip, input.feeStrategy?.tip ?? "proportional");
  const serviceShares = allocateFee(input.service, input.feeStrategy?.service ?? "proportional");
  const otherShares = allocateFee(input.otherFees, input.feeStrategy?.other ?? "proportional");

  const perPerson: PersonShare[] = people.map((personId, i) => {
    const subtotal = subtotalShares[i] ?? 0;
    const tax = taxShares[i] ?? 0;
    const tip = tipShares[i] ?? 0;
    const service = serviceShares[i] ?? 0;
    const other = otherShares[i] ?? 0;
    return {
      personId,
      subtotal,
      tax,
      tip,
      service,
      other,
      owed: subtotal + tax + tip + service + other,
    };
  });

  const subtotal = subtotalShares.reduce((a, b) => a + b, 0);
  const total = perPerson.reduce((a, p) => a + p.owed, 0);
  const declaredTotal = input.declaredTotal;

  return {
    currency: input.currency,
    perPerson,
    subtotal,
    tax: input.tax ?? 0,
    tip: input.tip ?? 0,
    service: input.service ?? 0,
    other: input.otherFees ?? 0,
    total,
    reconciliation: {
      declaredTotal,
      computedTotal: total,
      matchesDeclared: declaredTotal === undefined ? null : declaredTotal === total,
      deltaFromDeclared: declaredTotal === undefined ? undefined : total - declaredTotal,
    },
  };
}
