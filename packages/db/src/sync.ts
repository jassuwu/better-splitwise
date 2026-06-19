import type { Expense } from "@repo/splitwise";
import { expenseToRows } from "./mappers";
import type { MappedExpense } from "./mappers";

/** sync_state key under which the expense delta-sync watermark is stored. */
export const EXPENSE_CURSOR_KEY = "expenses_updated_after";

export interface ExpenseSyncPlan {
  /** Non-deleted expenses to upsert (rows + their shares). */
  upserts: MappedExpense[];
  /** Splitwise ids of expenses that were deleted upstream and should be removed locally. */
  deletedIds: number[];
  /** New watermark to persist (max `updated_at` seen), or the previous cursor if nothing was newer. */
  nextCursor: string | undefined;
}

/**
 * Turn a batch of expenses fetched with `get_expenses?updated_after=cursor` into
 * an idempotent local-sync plan. Pure — the caller applies it to the DB. ISO-8601
 * timestamps compare lexicographically, so string `max` is chronological.
 */
export function planExpenseSync(expenses: readonly Expense[], prevCursor?: string): ExpenseSyncPlan {
  const upserts: MappedExpense[] = [];
  const deletedIds: number[] = [];
  let nextCursor = prevCursor;

  for (const expense of expenses) {
    if (expense.deleted_at) {
      deletedIds.push(expense.id);
    } else {
      upserts.push(expenseToRows(expense));
    }
    const updated = expense.updated_at;
    if (updated && (nextCursor === undefined || updated > nextCursor)) {
      nextCursor = updated;
    }
  }

  return { upserts, deletedIds, nextCursor };
}
