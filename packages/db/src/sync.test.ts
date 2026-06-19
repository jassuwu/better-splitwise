import { describe, it, expect } from "vitest";
import type { Expense } from "@repo/splitwise";
import { planExpenseSync } from "./sync";

function exp(id: number, updated: string, deleted?: string): Expense {
  return {
    id,
    group_id: 1,
    description: `e${id}`,
    cost: "1.00",
    currency_code: "USD",
    payment: false,
    updated_at: updated,
    deleted_at: deleted ?? null,
    users: [{ user_id: 1, paid_share: "1.00", owed_share: "1.00" }],
  };
}

describe("planExpenseSync", () => {
  it("separates deletions from upserts and advances the cursor to the max updated_at", () => {
    const plan = planExpenseSync([
      exp(1, "2026-06-01T00:00:00Z"),
      exp(2, "2026-06-03T00:00:00Z", "2026-06-03T00:00:00Z"),
      exp(3, "2026-06-02T00:00:00Z"),
    ]);
    expect(plan.upserts.map((u) => u.expense.id!).sort((a, b) => a - b)).toEqual([1, 3]);
    expect(plan.deletedIds).toEqual([2]);
    expect(plan.nextCursor).toBe("2026-06-03T00:00:00Z");
  });

  it("leaves the cursor unchanged when there is nothing new", () => {
    expect(planExpenseSync([], "2026-01-01T00:00:00Z").nextCursor).toBe("2026-01-01T00:00:00Z");
  });

  it("never moves the cursor backwards", () => {
    const plan = planExpenseSync([exp(1, "2026-05-01T00:00:00Z")], "2026-06-01T00:00:00Z");
    expect(plan.nextCursor).toBe("2026-06-01T00:00:00Z");
  });
});
