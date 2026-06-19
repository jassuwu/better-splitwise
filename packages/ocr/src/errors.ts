/** Base class for all OCR errors. */
export class OcrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Non-2xx HTTP response from the OCR provider. */
export class OcrHttpError extends OcrError {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`OCR HTTP ${status}: ${body.slice(0, 200)}`);
  }
}

/** The model declined / the request was blocked (safety, recitation, no candidates). */
export class OcrBlockedError extends OcrError {
  constructor(public readonly reason: string) {
    super(`OCR request blocked: ${reason}`);
  }
}

/** The response was cut off (e.g. token limit) — a long receipt may be incomplete. */
export class OcrTruncatedError extends OcrError {
  constructor() {
    super("OCR response was truncated before completing; retry with a higher output limit");
  }
}

/** The model returned something that isn't a valid receipt (bad JSON or schema mismatch). */
export class OcrParseError extends OcrError {
  constructor(message: string) {
    super(`OCR could not parse the receipt: ${message}`);
  }
}
