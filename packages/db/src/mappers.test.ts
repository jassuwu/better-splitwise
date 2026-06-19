import { describe, it, expect } from "vitest";
import type { Expense } from "@repo/splitwise";
import { expenseToRows } from "./mappers";

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    group_id: 10,
    description: "Dinner",
    cost: "33.80",
    currency_code: "USD",
    payment: false,
    updated_at: "2026-06-01T00:00:00Z",
    users: [
      { user_id: 101, paid_share: "33.80", owed_share: "15.00" },
      { user: { id: 202, first_name: "Bob", last_name: null }, paid_share: "0.00", owed_share: "18.80" },
    ],
    ...overrides,
  };
}

describe("expenseToRows", () => {
  it("maps the expense and resolves share ids from user_id or the nested user", () => {
    const { expense: row, shares } = expenseToRows(expense());
    expect(row.id).toBe(1);
    expect(row.groupId).toBe(10);
    expect(row.currencyCode).toBe("USD");
    expect(shares).toHaveLength(2);
    expect(shares.map((s) => s.userId).sort((a, b) => a - b)).toEqual([101, 202]);
  });

  it("skips shares with no resolvable user id", () => {
    const { shares } = expenseToRows(expense({ users: [{ paid_share: "1.00", owed_share: "1.00" }] }));
    expect(shares).toHaveLength(0);
  });

  it("carries through payment and nullable fields", () => {
    const { expense: row } = expenseToRows(expense({ payment: true, group_id: null, date: undefined }));
    expect(row.payment).toBe(true);
    expect(row.groupId).toBeNull();
    expect(row.date).toBeNull();
  });
});
