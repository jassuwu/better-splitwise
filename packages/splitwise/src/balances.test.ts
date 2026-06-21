import { describe, it, expect } from "vitest";
import { debtBetween, friendGroupBalance, netWithMember } from "./balances";
import type { Friend, Group } from "./types";

const group: Group = {
  id: 1,
  name: "Goa",
  members: [],
  simplified_debts: [
    { from: 7, to: 9, amount: "12.50", currency_code: "INR" }, // I (7) owe 9
    { from: 5, to: 7, amount: "30.00", currency_code: "INR" }, // 5 owes me (7)
  ],
};

describe("debtBetween", () => {
  it("finds the debt regardless of direction", () => {
    expect(debtBetween(group, 7, 9)).toEqual({ debtorId: 7, creditorId: 9, amount: "12.50", currencyCode: "INR" });
  });
  it("returns null when settled", () => {
    expect(debtBetween(group, 7, 100)).toBeNull();
  });
  it("prefers original_debts when the group does not simplify", () => {
    const g: Group = {
      ...group,
      simplify_by_default: false,
      original_debts: [{ from: 9, to: 7, amount: "5.00", currency_code: "INR" }],
    };
    expect(debtBetween(g, 7, 9)?.amount).toBe("5.00");
  });
});

describe("netWithMember", () => {
  it("is negative when I owe", () => {
    expect(netWithMember(group, 7, 9)).toEqual({ amount: -12.5, currencyCode: "INR" });
  });
  it("is positive when they owe me", () => {
    expect(netWithMember(group, 7, 5)).toEqual({ amount: 30, currencyCode: "INR" });
  });
  it("is null when settled", () => {
    expect(netWithMember(group, 7, 100)).toBeNull();
  });
});

describe("friendGroupBalance", () => {
  const friend: Friend = {
    id: 9,
    first_name: "Sam",
    last_name: null,
    groups: [
      { group_id: 0, balance: [{ currency_code: "INR", amount: "-8.00" }] },
      { group_id: 1, balance: [{ currency_code: "INR", amount: "12.50" }] },
    ],
  };
  it("reads the per-group bucket (0 = non-group)", () => {
    expect(friendGroupBalance(friend, 0)?.amount).toBe("-8.00");
    expect(friendGroupBalance(friend, 1)?.amount).toBe("12.50");
  });
  it("returns null for an unknown group", () => {
    expect(friendGroupBalance(friend, 99)).toBeNull();
  });
});
