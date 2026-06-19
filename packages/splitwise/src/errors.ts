/** Base class for all Splitwise client errors. */
export class SplitwiseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 401 — the token is missing, invalid, or revoked. */
export class SplitwiseAuthError extends SplitwiseError {
  constructor(message = "Splitwise authentication failed (401)") {
    super(message);
  }
}

/** 429 — rate limited; `retryAfterSeconds` comes from the Retry-After header when present. */
export class SplitwiseRateLimitError extends SplitwiseError {
  constructor(
    public readonly retryAfterSeconds?: number,
    message = "Splitwise rate limit hit (429)",
  ) {
    super(message);
  }
}

/** A non-2xx HTTP error other than 401/429. */
export class SplitwiseHttpError extends SplitwiseError {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Splitwise HTTP ${status}: ${body.slice(0, 200)}`);
  }
}

/**
 * The Splitwise footgun: a 200 OK whose body carries a non-empty `errors`
 * object/array, meaning the write silently failed a domain rule (e.g. the
 * shares not summing to cost). We throw rather than return the failure as data.
 */
export class SplitwiseConstraintError extends SplitwiseError {
  constructor(public readonly errors: unknown) {
    super(`Splitwise rejected the request: ${formatErrors(errors)}`);
  }
}

function formatErrors(errors: unknown): string {
  if (Array.isArray(errors)) return errors.join("; ");
  if (errors && typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join("; ");
  }
  return String(errors);
}
