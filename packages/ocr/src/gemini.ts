import { ReceiptSchema } from "@repo/split-core";
import type { Receipt } from "@repo/split-core";
import { OcrBlockedError, OcrHttpError, OcrParseError, OcrTruncatedError } from "./errors";
import { DEFAULT_RECEIPT_PROMPT, geminiReceiptSchema } from "./schema";
import type { OcrProvider, ReceiptImage } from "./types";

export type ApiKeyInput = string | (() => string | Promise<string>);

export interface GeminiProviderConfig {
  apiKey: ApiKeyInput;
  /**
   * Model id. Gemini's lineup moves fast — set this to the current cheapest
   * flash / flash-lite model and verify against ai.google.dev on the first real call.
   */
  model?: string;
  /** Defaults to https://generativelanguage.googleapis.com/v1beta */
  baseUrl?: string;
  /** Override the extraction prompt. */
  prompt?: string;
  /** Inject a fetch implementation; defaults to the global fetch. Useful for tests. */
  fetch?: typeof globalThis.fetch;
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

/**
 * A Gemini structured-output adapter implementing {@link OcrProvider}. BYO API
 * key (personal or service). It asks Gemini for JSON constrained to a schema
 * derived from split-core's `ReceiptSchema`, then validates the result — but
 * callers must still run {@link reconcileReceipt}, since constrained decoding
 * guarantees the JSON shape, not the values.
 */
export function geminiProvider(config: GeminiProviderConfig): OcrProvider {
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = config.model ?? DEFAULT_MODEL;
  const prompt = config.prompt ?? DEFAULT_RECEIPT_PROMPT;
  const fetchImpl = config.fetch ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("geminiProvider: no fetch implementation available; pass `fetch` in config");

  return {
    async extractReceipt(image: ReceiptImage): Promise<Receipt> {
      const apiKey = typeof config.apiKey === "function" ? await config.apiKey() : config.apiKey;
      const body = {
        contents: [
          {
            parts: [
              { inlineData: { mimeType: image.mimeType, data: image.base64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiReceiptSchema,
        },
      };

      const res = await fetchImpl(`${baseUrl}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new OcrHttpError(res.status, await safeText(res));

      const data = (await res.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new OcrBlockedError(data.promptFeedback?.blockReason ?? "no candidates returned");
      }
      const finish = candidate.finishReason;
      if (finish === "MAX_TOKENS") throw new OcrTruncatedError();
      if (finish && finish !== "STOP") throw new OcrBlockedError(finish);

      const text = candidate.content?.parts?.[0]?.text;
      if (!text) throw new OcrParseError("the model returned an empty response");

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new OcrParseError("the model returned invalid JSON");
      }

      const parsed = ReceiptSchema.safeParse(json);
      if (!parsed.success) throw new OcrParseError(parsed.error.message);
      return parsed.data;
    },
  };
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
