import type { Receipt } from "@repo/split-core";

export type ReceiptImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/heic"
  | "image/heif";

/** A receipt image to extract. Base64 (no data: prefix) is the common denominator across Expo + web. */
export interface ReceiptImage {
  base64: string;
  mimeType: ReceiptImageMimeType;
}

/**
 * Provider-agnostic OCR. Adapters (Gemini, OpenAI-compatible, on-device) all
 * implement this single method, so the rest of the app — and the BYO-key model —
 * never depends on which provider is configured.
 */
export interface OcrProvider {
  extractReceipt(image: ReceiptImage): Promise<Receipt>;
}
