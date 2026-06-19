/**
 * Money is represented as integer minor units ("cents") throughout the domain
 * so that every arithmetic operation is exact. Decimal strings/numbers only
 * appear at the edges: parsing OCR output, and formatting amounts to push to
 * Splitwise (which itself wants 2-decimal strings).
 */

export type Cents = number;

const MONEY_RE = /^(-?)(\d*)(?:\.(\d+))?$/;

/** Parse a decimal amount (string or number) into integer cents. */
export function toCents(input: string | number): Cents {
  const str = (typeof input === "number" ? String(input) : input).trim();
  const m = MONEY_RE.exec(str);
  const whole = m?.[2] ?? "";
  const frac = m?.[3] ?? "";
  if (!m || (whole === "" && frac === "")) {
    throw new Error(`Invalid money value: ${JSON.stringify(input)}`);
  }
  const sign = (m[1] ?? "") === "-" ? -1 : 1;
  let cents = (whole === "" ? 0 : Number(whole)) * 100;
  if (frac.length > 0) {
    cents += Number(frac.slice(0, 2).padEnd(2, "0"));
    // round half-up using the third decimal place, if present
    if (Number(frac.slice(2, 3) || "0") >= 5) cents += 1;
  }
  return sign * cents;
}

/** Format integer cents as a 2-decimal string, e.g. 1234 -> "12.34". */
export function fromCents(cents: Cents): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`fromCents expects an integer, got ${cents}`);
  }
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}
