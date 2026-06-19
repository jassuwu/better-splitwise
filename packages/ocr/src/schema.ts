import { z } from "zod";
import { ReceiptSchema } from "@repo/split-core";

type JsonObject = Record<string, unknown>;

// Gemini's responseSchema accepts only a subset of JSON Schema. Strip keywords
// it rejects, and inline any $ref/$defs so the schema is self-contained.
const STRIP_KEYS = new Set([
  "$schema",
  "additionalProperties",
  "default",
  "$defs",
  "definitions",
  // numeric/string constraints Gemini's responseSchema subset rejects (Zod emits
  // exclusiveMinimum for .positive(), etc.). Gemini keeps minimum/maximum/minItems/maxItems.
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
]);

function clean(node: unknown, defs: JsonObject): unknown {
  if (Array.isArray(node)) return node.map((n) => clean(n, defs));
  if (node && typeof node === "object") {
    const obj = node as JsonObject;
    const ref = obj["$ref"];
    if (typeof ref === "string") {
      const name = ref.split("/").pop();
      const target = name ? defs[name] : undefined;
      return clean(target ?? {}, defs);
    }
    const out: JsonObject = {};
    for (const [key, value] of Object.entries(obj)) {
      if (STRIP_KEYS.has(key)) continue;
      out[key] = clean(value, defs);
    }
    return out;
  }
  return node;
}

/**
 * A Gemini-compatible `responseSchema`, derived from split-core's `ReceiptSchema`
 * so there is a single source of truth for both extraction and validation.
 */
export function buildGeminiReceiptSchema(): JsonObject {
  const raw = z.toJSONSchema(ReceiptSchema) as JsonObject;
  const defs = (raw["$defs"] ?? raw["definitions"] ?? {}) as JsonObject;
  return clean(raw, defs) as JsonObject;
}

export const geminiReceiptSchema: JsonObject = buildGeminiReceiptSchema();

export const DEFAULT_RECEIPT_PROMPT =
  "Extract this receipt as structured JSON. List every line item with its description, quantity, and line total. " +
  "Capture the subtotal, tax, tip, service charge, any other fees, the grand total, the ISO 4217 currency code, and the merchant if visible. " +
  "Amounts are decimal numbers in the receipt's currency. Omit any field that is not present on the receipt.";
