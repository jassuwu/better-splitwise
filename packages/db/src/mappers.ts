import type { Expense } from "@repo/splitwise";
import type { NewExpenseRow, NewExpenseShareRow } from "./schema";

export interface MappedExpense {
  expense: NewExpenseRow;
  shares: NewExpenseShareRow[];
}

/**
 * Map a Splitwise API expense to local rows. Each share's user id is resolved
 * from either `user_id` or the nested `user.id`; shares with neither are skipped.
 */
export function expenseToRows(expense: Expense): MappedExpense {
  const shares: NewExpenseShareRow[] = [];
  for (const share of expense.users) {
    const userId = share.user_id ?? share.user?.id;
    if (userId === undefined) continue;
    shares.push({
      expenseId: expense.id,
      userId,
      paidShare: share.paid_share,
      owedShare: share.owed_share,
    });
  }

  return {
    expense: {
      id: expense.id,
      groupId: expense.group_id ?? null,
      description: expense.description,
      cost: expense.cost,
      currencyCode: expense.currency_code,
      payment: expense.payment,
      date: expense.date ?? null,
      updatedAt: expense.updated_at ?? null,
      deletedAt: expense.deleted_at ?? null,
    },
    shares,
  };
}
