import { describe, expect, it } from "vitest";

import { decodeItemization, encodeItemization, type Itemization } from "./itemization";

const sample: Itemization = {
  currency: "INR",
  items: [
    { label: "Nachos", cents: 450, assignees: [12, 34] },
    { label: "Margarita", cents: 520, assignees: [12] },
    { label: "Pad Thai", cents: 380, assignees: [34, 56] },
  ],
  fees: { tax: 90, tip: 150, service: 60, tipStrategy: "equal" },
};

const names = { 12: "Alice", 34: "Bob", 56: "Carol" };

describe("itemization round-trip", () => {
  it("decodes exactly what it encoded", () => {
    const back = decodeItemization(encodeItemization(sample, names));
    expect(back).toEqual({
      currency: "INR",
      items: sample.items,
      fees: { tax: 90, tip: 150, service: 60, other: undefined, tipStrategy: "equal" },
    });
  });

  it("keeps a human-readable summary above the machine line", () => {
    const comment = encodeItemization(sample, names);
    expect(comment).toContain("split by item");
    expect(comment).toContain("Nachos");
    expect(comment).toContain("Alice, Bob");
    expect(comment.split("\n").some((l) => l.startsWith("bs1:"))).toBe(true);
  });

  it("falls back to #id when a name is missing", () => {
    expect(encodeItemization(sample)).toContain("#12, #34");
  });

  it("defaults the tip strategy to proportional", () => {
    const plain: Itemization = { currency: "USD", items: [{ label: "x", cents: 100, assignees: [1] }], fees: {} };
    expect(decodeItemization(encodeItemization(plain))?.fees.tipStrategy).toBe("proportional");
  });
});

describe("decodeItemization degrades gracefully", () => {
  it("returns null for non-itemization input", () => {
    expect(decodeItemization("just a normal comment")).toBeNull();
    expect(decodeItemization("")).toBeNull();
    expect(decodeItemization(null)).toBeNull();
    expect(decodeItemization(undefined)).toBeNull();
  });

  it("returns null when the machine line is corrupt or a newer version", () => {
    expect(decodeItemization("nice\nbs1:{not json")).toBeNull();
    expect(decodeItemization('bs1:{"v":2,"c":"INR","i":[]}')).toBeNull();
    expect(decodeItemization('bs1:{"v":1,"c":"INR"}')).toBeNull();
  });

  it("still finds the marker when a user adds text around it", () => {
    const edited = `someone's note\n${encodeItemization(sample, names)}\nand a trailing line`;
    expect(decodeItemization(edited)?.items).toHaveLength(3);
  });
});
