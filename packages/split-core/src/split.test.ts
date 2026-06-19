import { describe, it, expect } from "vitest";
import { computeSplit } from "./split";
import type { SplitInput } from "./split";

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

describe("computeSplit", () => {
  it("splits a shared bill with proportional tax and tip, exactly", () => {
    const input: SplitInput = {
      currency: "USD",
      people: ["alice", "bob"],
      items: [
        { id: "i1", label: "Pad Thai", total: 1200, assignees: ["alice"] },
        { id: "i2", label: "Burger", total: 800, assignees: ["bob"] },
        { id: "i3", label: "Fries", total: 600, assignees: ["alice", "bob"] },
      ],
      tax: 260,
      tip: 520,
    };
    const r = computeSplit(input);
    expect(r.subtotal).toBe(2600);
    expect(r.total).toBe(3380);
    expect(sum(r.perPerson.map((p) => p.owed))).toBe(3380);

    const alice = r.perPerson.find((p) => p.personId === "alice")!;
    const bob = r.perPerson.find((p) => p.personId === "bob")!;
    expect(alice.subtotal).toBe(1500); // 1200 + 300
    expect(bob.subtotal).toBe(1100); // 800 + 300
    expect(alice.tax + bob.tax).toBe(260);
    expect(alice.tip + bob.tip).toBe(520);
  });

  it("can split tip equally while tax stays proportional", () => {
    const r = computeSplit({
      currency: "USD",
      people: ["a", "b", "c"],
      items: [
        { id: "i1", label: "x", total: 1000, assignees: ["a"] },
        { id: "i2", label: "y", total: 500, assignees: ["b"] },
        { id: "i3", label: "z", total: 0, assignees: ["c"] },
      ],
      tax: 150,
      tip: 300,
      feeStrategy: { tip: "equal" },
    });
    expect([...r.perPerson.map((p) => p.tip)].sort()).toEqual([100, 100, 100]);
    const byId = Object.fromEntries(r.perPerson.map((p) => [p.personId, p]));
    expect(byId["a"]!.tax).toBe(100);
    expect(byId["b"]!.tax).toBe(50);
    expect(byId["c"]!.tax).toBe(0);
    expect(r.total).toBe(1500 + 150 + 300);
    expect(sum(r.perPerson.map((p) => p.owed))).toBe(r.total);
  });

  it("reconciles a matching declared total", () => {
    const r = computeSplit({
      currency: "INR",
      people: ["a", "b"],
      items: [{ id: "i", label: "thali", total: 1000, assignees: ["a", "b"] }],
      tax: 50,
      declaredTotal: 1050,
    });
    expect(r.reconciliation.matchesDeclared).toBe(true);
    expect(r.reconciliation.deltaFromDeclared).toBe(0);
  });

  it("flags a mismatched declared total (OCR noise)", () => {
    const r = computeSplit({
      currency: "INR",
      people: ["a", "b"],
      items: [{ id: "i", label: "thali", total: 1000, assignees: ["a", "b"] }],
      tax: 50,
      declaredTotal: 1099,
    });
    expect(r.reconciliation.matchesDeclared).toBe(false);
    expect(r.reconciliation.deltaFromDeclared).toBe(1050 - 1099);
  });

  it("validates people and assignees", () => {
    expect(() => computeSplit({ currency: "USD", people: [], items: [] })).toThrow();
    expect(() =>
      computeSplit({
        currency: "USD",
        people: ["a"],
        items: [{ id: "i", label: "x", total: 100, assignees: ["ghost"] }],
      }),
    ).toThrow();
  });

  it("property: owed shares always sum exactly to total", () => {
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let t = 0; t < 500; t++) {
      const np = 1 + Math.floor(rand() * 5);
      const people = Array.from({ length: np }, (_, i) => `p${i}`);
      const ni = 1 + Math.floor(rand() * 6);
      const items = Array.from({ length: ni }, (_, i) => {
        const k = 1 + Math.floor(rand() * np);
        return { id: `i${i}`, label: `i${i}`, total: Math.floor(rand() * 5000), assignees: people.slice(0, k) };
      });
      const r = computeSplit({
        currency: "USD",
        people,
        items,
        tax: Math.floor(rand() * 800),
        tip: Math.floor(rand() * 800),
        service: Math.floor(rand() * 400),
      });
      expect(sum(r.perPerson.map((p) => p.owed))).toBe(r.total);
      expect(r.total).toBe(r.subtotal + r.tax + r.tip + r.service + r.other);
    }
  });
});
