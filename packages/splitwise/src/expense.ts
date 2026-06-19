import { fromCents } from "@repo/split-core";
import type { SplitResult } from "@repo/split-core";
import type { CreateExpenseParams } from "./types";

export interface BuildExpenseOptions {
  /** 0 for a non-group (friend) expense. */
  groupId: number;
  description: string;
  /** split-core PersonId of the payer; recorded as paying the whole cost. */
  payerId: string;
  /** Maps each split-core PersonId to its Splitwise numeric user_id. */
  userIds: Record<string, number>;
  /** Defaults to the split's currency. */
  currencyCode?: string;
  /** ISO 8601 date. */
  date?: string;
  /** Free-text notes stored on the expense. */
  details?: string;
  categoryId?: number;
  /** true => record as a settle-up payment (Splitwise has no dedicated endpoint). */
  payment?: boolean;
}

/**
 * Map a split-core {@link SplitResult} to Splitwise's flattened by-shares
 * create_expense body. The payer is recorded as paying the whole cost; every
 * participant's owed_share comes straight from the split. Both the paid_share
 * and owed_share columns sum exactly to cost (split-core guarantees the owed
 * side), which is what create_expense requires.
 */
export function toCreateExpenseParams(split: SplitResult, opts: BuildExpenseOptions): CreateExpenseParams {
  if (!split.perPerson.some((p) => p.personId === opts.payerId)) {
    throw new Error(`toCreateExpenseParams: payer "${opts.payerId}" is not among the split participants`);
  }

  const params: CreateExpenseParams = {
    cost: fromCents(split.total),
    description: opts.description,
    group_id: opts.groupId,
    currency_code: opts.currencyCode ?? split.currency,
  };
  if (opts.date) params.date = opts.date;
  if (opts.details) params.details = opts.details;
  if (opts.categoryId !== undefined) params.category_id = opts.categoryId;
  if (opts.payment) params.payment = true;

  split.perPerson.forEach((p, i) => {
    const userId = opts.userIds[p.personId];
    if (userId === undefined) {
      throw new Error(`toCreateExpenseParams: no Splitwise user_id mapped for "${p.personId}"`);
    }
    params[`users__${i}__user_id`] = userId;
    params[`users__${i}__paid_share`] = fromCents(p.personId === opts.payerId ? split.total : 0);
    params[`users__${i}__owed_share`] = fromCents(p.owed);
  });

  return params;
}

/**
 * A compact, human-readable itemization to post as an expense comment, so that
 * vanilla Splitwise users see the per-person breakdown that Splitwise itself
 * doesn't store. Pass a `personId -> display name` map for friendly names.
 */
export function formatItemizationComment(split: SplitResult, names: Record<string, string> = {}): string {
  const lines = split.perPerson.map((p) => {
    const name = names[p.personId] ?? p.personId;
    const parts = [`items ${fromCents(p.subtotal)}`];
    if (p.tax) parts.push(`tax ${fromCents(p.tax)}`);
    if (p.tip) parts.push(`tip ${fromCents(p.tip)}`);
    if (p.service) parts.push(`service ${fromCents(p.service)}`);
    if (p.other) parts.push(`fees ${fromCents(p.other)}`);
    return `${name}: ${fromCents(p.owed)} (${parts.join(" + ")})`;
  });
  return [`split by item via super-splitwise · ${split.currency}`, ...lines].join("\n");
}
