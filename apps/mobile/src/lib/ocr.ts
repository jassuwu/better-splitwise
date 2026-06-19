import { geminiProvider, type OcrProvider } from '@repo/ocr';

import { getGeminiKey } from './token-store';

/** An OCR provider backed by Gemini, pulling the BYO key from secure storage per request. */
export function createOcrProvider(): OcrProvider {
  return geminiProvider({
    apiKey: async () => {
      const key = await getGeminiKey();
      if (!key) throw new Error('No Gemini API key configured');
      return key;
    },
  });
}
