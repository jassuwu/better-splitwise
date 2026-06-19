import { describe, it, expect } from "vitest";
import { ReceiptSchema, receiptJsonSchema } from "./schema";

describe("ReceiptSchema", () => {
  it("parses a typical receipt and applies the quantity default", () => {
    const r = ReceiptSchema.parse({
      currency: "USD",
      items: [
        { description: "Pad Thai", total: 12.0 },
        { description: "Beer", quantity: 2, unitPrice: 5, total: 10 },
      ],
      tax: 2.2,
      tip: 4,
      total: 28.2,
    });
    expect(r.items[0]!.quantity).toBe(1);
    expect(r.total).toBe(28.2);
  });

  it("rejects a receipt missing required fields", () => {
    expect(() => ReceiptSchema.parse({ items: [] })).toThrow();
  });

  it("derives a JSON schema usable as an LLM responseSchema", () => {
    expect(receiptJsonSchema).toMatchObject({ type: "object" });
    const props = (receiptJsonSchema as { properties?: Record<string, unknown> }).properties ?? {};
    for (const key of ["currency", "items", "total", "tax", "tip"]) {
      expect(props).toHaveProperty(key);
    }
  });
});
