import { describe, it, expect, vi } from "vitest";
import { geminiProvider } from "./gemini";
import { OcrBlockedError, OcrHttpError, OcrParseError, OcrTruncatedError } from "./errors";
import type { ReceiptImage } from "./types";

const image: ReceiptImage = { base64: "QkFTRTY0", mimeType: "image/jpeg" };

function mockResponse(body: unknown, init: { status?: number } = {}): Response {
  const status = init.status ?? 200;
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function geminiBody(receiptJson: unknown, finishReason = "STOP") {
  return { candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(receiptJson) }] } }] };
}

const validReceipt = { currency: "USD", items: [{ description: "Pad Thai", total: 12 }], tax: 1, total: 13 };
const asFetch = (fn: () => Promise<Response>) => fn as unknown as typeof fetch;

describe("geminiProvider", () => {
  it("sends the api key + inline image + responseSchema and parses the receipt", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse(geminiBody(validReceipt)));
    const provider = geminiProvider({ apiKey: "gem-key", model: "gemini-x", fetch: fetchImpl });
    const receipt = await provider.extractReceipt(image);
    expect(receipt.total).toBe(13);
    expect(receipt.items[0]!.description).toBe("Pad Thai");

    const call = fetchImpl.mock.calls[0];
    expect(String(call?.[0])).toContain("/models/gemini-x:generateContent");
    expect(call?.[1]?.headers).toMatchObject({ "x-goog-api-key": "gem-key" });
    const sent = JSON.parse(String(call?.[1]?.body));
    expect(sent.contents[0].parts[0].inlineData).toMatchObject({ mimeType: "image/jpeg", data: "QkFTRTY0" });
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(sent.generationConfig.responseSchema.type).toBe("object");
  });

  it("resolves an async api-key provider", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse(geminiBody(validReceipt)));
    const provider = geminiProvider({ apiKey: async () => "fresh", fetch: fetchImpl });
    await provider.extractReceipt(image);
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({ "x-goog-api-key": "fresh" });
  });

  it("throws OcrHttpError on a non-2xx response", async () => {
    const provider = geminiProvider({ apiKey: "k", fetch: asFetch(async () => mockResponse({}, { status: 400 })) });
    await expect(provider.extractReceipt(image)).rejects.toBeInstanceOf(OcrHttpError);
  });

  it("throws OcrBlockedError when there are no candidates", async () => {
    const provider = geminiProvider({
      apiKey: "k",
      fetch: asFetch(async () => mockResponse({ promptFeedback: { blockReason: "SAFETY" } })),
    });
    await expect(provider.extractReceipt(image)).rejects.toBeInstanceOf(OcrBlockedError);
  });

  it("throws OcrTruncatedError on MAX_TOKENS", async () => {
    const provider = geminiProvider({
      apiKey: "k",
      fetch: asFetch(async () => mockResponse(geminiBody(validReceipt, "MAX_TOKENS"))),
    });
    await expect(provider.extractReceipt(image)).rejects.toBeInstanceOf(OcrTruncatedError);
  });

  it("throws OcrParseError when the output fails the receipt schema", async () => {
    const provider = geminiProvider({
      apiKey: "k",
      fetch: asFetch(async () => mockResponse(geminiBody({ currency: "USD" }))),
    });
    await expect(provider.extractReceipt(image)).rejects.toBeInstanceOf(OcrParseError);
  });
});
