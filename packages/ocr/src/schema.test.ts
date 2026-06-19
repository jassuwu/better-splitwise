import { describe, it, expect } from "vitest";
import { buildGeminiReceiptSchema, geminiReceiptSchema } from "./schema";

function collectKeys(node: unknown, keys: Set<string>): void {
  if (Array.isArray(node)) {
    for (const child of node) collectKeys(child, keys);
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      keys.add(key);
      collectKeys(value, keys);
    }
  }
}

describe("geminiReceiptSchema", () => {
  it("is a self-contained object schema with the expected fields", () => {
    expect(geminiReceiptSchema).toMatchObject({ type: "object" });
    const props = (geminiReceiptSchema as { properties?: Record<string, unknown> }).properties ?? {};
    for (const key of ["currency", "items", "total", "tax", "tip"]) {
      expect(props).toHaveProperty(key);
    }
  });

  it("strips JSON-Schema keywords Gemini rejects and inlines any refs", () => {
    const keys = new Set<string>();
    collectKeys(buildGeminiReceiptSchema(), keys);
    for (const banned of [
      "$schema",
      "$ref",
      "$defs",
      "definitions",
      "additionalProperties",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "minLength",
      "maxLength",
      "pattern",
    ]) {
      expect(keys.has(banned)).toBe(false);
    }
  });
});
