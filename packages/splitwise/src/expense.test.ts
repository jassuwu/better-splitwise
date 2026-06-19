import { describe, it, expect } from "vitest";
import { computeSplit } from "@repo/split-core";
import { toCreateExpenseParams, formatItemizationComment } from "./expense";

const split = computeSplit({
  currency: "USD",
  people: ["alice", "bob"],
  items: [
    { id: "i1", label: "Pad Thai", total: 1200, assignees: ["alice"] },
    { id: "i2", label: "Burger", total: 800, assignees: ["bob"] },
    { id: "i3", label: "Fries", total: 600, assignees: ["alice", "bob"] },
  ],
  tax: 260,
  tip: 520,
});
const userIds = { alice: 101, bob: 202 };
const cents = (s: unknown) => Math.round(Number(s) * 100);

describe("toCreateExpenseParams", () => {
  it("emits the flat by-shares body with cost, group, and currency", () => {
    const p = toCreateExpenseParams(split, { groupId: 42, description: "Dinner", payerId: "alice", userIds });
    expect(p.cost).toBe("33.80");
    expect(p.group_id).toBe(42);
    expect(p.currency_code).toBe("USD");
    expect(p.description).toBe("Dinner");
    expect(p["users__0__user_id"]).toBe(101);
    expect(p["users__1__user_id"]).toBe(202);
  });

  it("records the payer as paying the whole cost and everyone else zero", () => {
    const p = toCreateExpenseParams(split, { groupId: 0, description: "x", payerId: "alice", userIds });
    expect(p["users__0__paid_share"]).toBe("33.80");
    expect(p["users__1__paid_share"]).toBe("0.00");
  });

  it("paid_share and owed_share columns each sum exactly to cost", () => {
    const p = toCreateExpenseParams(split, { groupId: 0, description: "x", payerId: "bob", userIds });
    const paid = cents(p["users__0__paid_share"]) + cents(p["users__1__paid_share"]);
    const owed = cents(p["users__0__owed_share"]) + cents(p["users__1__owed_share"]);
    expect(paid).toBe(cents(p.cost));
    expect(owed).toBe(cents(p.cost));
  });

  it("sets the payment flag for settle-ups", () => {
    const p = toCreateExpenseParams(split, { groupId: 0, description: "settle", payerId: "alice", userIds, payment: true });
    expect(p.payment).toBe(true);
  });

  it("throws when the payer is not a participant or a user_id is unmapped", () => {
    expect(() => toCreateExpenseParams(split, { groupId: 0, description: "x", payerId: "ghost", userIds })).toThrow();
    expect(() =>
      toCreateExpenseParams(split, { groupId: 0, description: "x", payerId: "alice", userIds: { alice: 1 } }),
    ).toThrow();
  });
});

describe("formatItemizationComment", () => {
  it("produces a readable per-person breakdown with names", () => {
    const text = formatItemizationComment(split, { alice: "Alice", bob: "Bob" });
    expect(text).toContain("Alice:");
    expect(text).toContain("Bob:");
    expect(text).toContain("USD");
    expect(text).toContain("tax");
  });
});
