import { fromCents } from "@repo/split-core";

/**
 * A round-trippable itemization carried inside a Splitwise expense comment.
 *
 * Splitwise stores only final per-person amounts, never the per-item breakdown.
 * Better Splitwise keeps that breakdown where it belongs — on the expense — by
 * writing it into the comment: a human-readable summary that vanilla Splitwise
 * users can read, followed by one machine line that {@link decodeItemization}
 * parses back into this shape. Nothing is stored on the device, so an itemized
 * split survives reinstall and shows up rich on every device.
 */
export interface ItemAssignment {
  readonly label: string;
  /** Line total in integer cents. */
  readonly cents: number;
  /** Splitwise numeric user_ids sharing this item. */
  readonly assignees: readonly number[];
}

export type TipStrategy = "equal" | "proportional";

export interface ItemizationFees {
  readonly tax?: number;
  readonly tip?: number;
  readonly service?: number;
  readonly other?: number;
  /** How the tip was split; defaults to proportional. */
  readonly tipStrategy?: TipStrategy;
}

export interface Itemization {
  readonly currency: string;
  readonly items: readonly ItemAssignment[];
  readonly fees: ItemizationFees;
}

/** Tags the machine-readable line. Versioned (`bs1`) so the format can evolve. */
const MARKER = "bs1:";

/** Cap a label so a pathological receipt can't bloat the comment past Splitwise's limit. */
const MAX_LABEL = 60;

interface Wire {
  v: 1;
  c: string;
  i: [string, number, number[]][];
  f?: { x?: number; t?: number; s?: number; o?: number; te?: 1 };
}

function toWire(it: Itemization): Wire {
  const f: NonNullable<Wire["f"]> = {};
  if (it.fees.tax) f.x = it.fees.tax;
  if (it.fees.tip) f.t = it.fees.tip;
  if (it.fees.service) f.s = it.fees.service;
  if (it.fees.other) f.o = it.fees.other;
  if (it.fees.tipStrategy === "equal") f.te = 1;
  const wire: Wire = {
    v: 1,
    c: it.currency,
    i: it.items.map((item) => [item.label.slice(0, MAX_LABEL), item.cents, [...item.assignees]]),
  };
  if (Object.keys(f).length > 0) wire.f = f;
  return wire;
}

function humanBlock(it: Itemization, names: Record<number, string>): string {
  const lines = [`split by item · better splitwise · ${it.currency}`];
  for (const item of it.items) {
    const who = item.assignees.map((id) => names[id] ?? `#${id}`).join(", ");
    lines.push(`${item.label || "item"} — ${fromCents(item.cents)}${who ? ` · ${who}` : ""}`);
  }
  const f = it.fees;
  const parts: string[] = [];
  if (f.tax) parts.push(`tax ${fromCents(f.tax)}`);
  if (f.tip) parts.push(`tip ${fromCents(f.tip)}${f.tipStrategy === "equal" ? " (split equally)" : ""}`);
  if (f.service) parts.push(`service ${fromCents(f.service)}`);
  if (f.other) parts.push(`fees ${fromCents(f.other)}`);
  if (parts.length > 0) lines.push(`+ ${parts.join(" · ")}`);
  return lines.join("\n");
}

/**
 * Build the expense comment for an itemization: a readable summary followed by a
 * single machine line ({@link MARKER}) that {@link decodeItemization} reverses.
 * Pass a `user_id -> display name` map for friendly names in the readable part.
 */
export function encodeItemization(it: Itemization, names: Record<number, string> = {}): string {
  return `${humanBlock(it, names)}\n${MARKER}${JSON.stringify(toWire(it))}`;
}

/**
 * Parse a Splitwise comment back into an {@link Itemization}, or null if it isn't
 * a Better Splitwise itemization — a plain comment, or one a user has since
 * edited into something we can no longer read. Never throws.
 */
export function decodeItemization(comment: string | null | undefined): Itemization | null {
  if (!comment) return null;
  const line = comment
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(MARKER));
  if (!line) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(line.slice(MARKER.length));
  } catch {
    return null;
  }
  return fromWire(raw);
}

function fromWire(raw: unknown): Itemization | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || typeof o.c !== "string" || !Array.isArray(o.i)) return null;

  const items: ItemAssignment[] = [];
  for (const entry of o.i) {
    if (!Array.isArray(entry) || entry.length < 3) return null;
    const [label, cents, assignees] = entry as [unknown, unknown, unknown];
    if (typeof label !== "string") return null;
    if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
    if (!Array.isArray(assignees) || !assignees.every((a) => typeof a === "number")) return null;
    items.push({ label, cents, assignees: assignees as number[] });
  }

  const fee = (o.f ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const fees: ItemizationFees = {
    tax: num(fee.x),
    tip: num(fee.t),
    service: num(fee.s),
    other: num(fee.o),
    tipStrategy: fee.te === 1 ? "equal" : "proportional",
  };

  return { currency: o.c, items, fees };
}
