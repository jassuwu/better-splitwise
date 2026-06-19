import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";
import type { Receipt, SplitResult } from "@repo/split-core";

/** Mirror of Splitwise groups. */
export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

/** Mirror of the Splitwise expense ledger — the settlement source of truth. */
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey(), // Splitwise expense id
  groupId: integer("group_id"),
  description: text("description").notNull(),
  cost: text("cost").notNull(),
  currencyCode: text("currency_code").notNull(),
  payment: integer("payment", { mode: "boolean" }).notNull().default(false),
  date: text("date"),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
});

export const expenseShares = sqliteTable(
  "expense_shares",
  {
    expenseId: integer("expense_id").notNull(),
    userId: integer("user_id").notNull(),
    paidShare: text("paid_share").notNull(),
    owedShare: text("owed_share").notNull(),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.userId] })],
);

/** The rich per-item layer Splitwise can't store, keyed by the Splitwise expense id. */
export interface RichReceiptPayload {
  receipt: Receipt;
  split: SplitResult;
}

export const receipts = sqliteTable("receipts", {
  expenseId: integer("expense_id").primaryKey(),
  currency: text("currency").notNull(),
  payload: text("payload", { mode: "json" }).notNull().$type<RichReceiptPayload>(),
  updatedAt: text("updated_at"),
});

/** Key-value store for sync cursors (e.g. the get_expenses `updated_after` watermark). */
export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const schema = { groups, expenses, expenseShares, receipts, syncState };

export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;
export type ExpenseShareRow = typeof expenseShares.$inferSelect;
export type NewExpenseShareRow = typeof expenseShares.$inferInsert;
export type ReceiptRow = typeof receipts.$inferSelect;
export type NewReceiptRow = typeof receipts.$inferInsert;
