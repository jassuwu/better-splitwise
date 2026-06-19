import { describe, it, expect } from "vitest";
import { ReceiptSchema } from "@repo/split-core";
import { reconcileReceipt } from "./reconcile";

describe("reconcileReceipt", () => {
  it("passes when items + fees equal the declared total", () => {
    const receipt = ReceiptSchema.parse({
      currency: "USD",
      items: [
        { description: "A", total: 12 },
        { description: "B", total: 8 },
      ],
      tax: 2,
      tip: 4,
      total: 26,
    });
    const r = reconcileReceipt(receipt);
    expect(r.itemsSubtotalCents).toBe(2000);
    expect(r.feesCents).toBe(600);
    expect(r.computedTotalCents).toBe(2600);
    expect(r.declaredTotalCents).toBe(2600);
    expect(r.deltaCents).toBe(0);
    expect(r.ok).toBe(true);
  });

  it("flags a mismatch when the OCR missed an item", () => {
    const receipt = ReceiptSchema.parse({
      currency: "USD",
      items: [{ description: "A", total: 12 }],
      tax: 2,
      total: 26,
    });
    const r = reconcileReceipt(receipt);
    expect(r.ok).toBe(false);
    expect(r.computedTotalCents).toBe(1400);
    expect(r.deltaCents).toBe(1400 - 2600);
  });

  it("honors a cent tolerance", () => {
    const receipt = ReceiptSchema.parse({
      currency: "USD",
      items: [{ description: "A", total: 10.0 }],
      total: 10.01,
    });
    expect(reconcileReceipt(receipt).ok).toBe(false);
    expect(reconcileReceipt(receipt, 1).ok).toBe(true);
  });
});
