import { z } from "zod";

/**
 * A single line item as read from a receipt. Amounts are decimal numbers in
 * the receipt's currency (converted to integer cents at the domain boundary
 * via {@link toCents}).
 */
export const ReceiptItemSchema = z.object({
  description: z.string().describe("Item name as printed on the receipt"),
  quantity: z.number().int().positive().default(1).describe("Number of units"),
  unitPrice: z.number().nonnegative().optional().describe("Price per unit, if shown"),
  total: z.number().nonnegative().describe("Line total for this item (quantity * unit price)"),
});
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

/**
 * Structured receipt extracted from an image by the OCR layer. This is the
 * single source of truth: {@link receiptJsonSchema} is derived from it for the
 * LLM `responseSchema`, and the same schema validates the model's output at
 * runtime.
 */
export const ReceiptSchema = z.object({
  merchant: z.string().optional().describe("Merchant / restaurant name"),
  currency: z.string().describe("ISO 4217 currency code, e.g. USD, INR, EUR"),
  items: z.array(ReceiptItemSchema).describe("All line items on the receipt"),
  subtotal: z.number().nonnegative().optional().describe("Sum of items before tax/tip/fees"),
  tax: z.number().nonnegative().optional().describe("Total tax"),
  tip: z.number().nonnegative().optional().describe("Tip / gratuity"),
  service: z.number().nonnegative().optional().describe("Service charge"),
  fees: z.number().nonnegative().optional().describe("Any other fees (delivery, packaging, etc.)"),
  total: z.number().nonnegative().describe("Grand total actually charged"),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

/**
 * JSON Schema derived from {@link ReceiptSchema}. Pass this as the LLM
 * structured-output `responseSchema` (Gemini / OpenAI / Claude) so one Zod
 * schema drives both extraction and validation. NOTE: providers accept a
 * subset of JSON Schema, so the OCR adapter may post-process this (e.g. strip
 * `$schema`) per provider.
 */
export const receiptJsonSchema = z.toJSONSchema(ReceiptSchema);
