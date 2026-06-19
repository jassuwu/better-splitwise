import { describe, it, expect } from "vitest";
import { allocateByWeights, allocateEqually } from "./allocate";

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

describe("allocateEqually", () => {
  it("splits evenly when divisible", () => {
    expect(allocateEqually(1000, 4)).toEqual([250, 250, 250, 250]);
  });

  it("hands leftover cents to the front, deterministically", () => {
    // 1000 / 3 = 333.33; 1 leftover cent -> first index
    expect(allocateEqually(1000, 3)).toEqual([334, 333, 333]);
  });

  it("always sums exactly and stays within one cent across shares", () => {
    for (const amount of [0, 1, 7, 99, 100, 1234, 99999]) {
      for (const n of [1, 2, 3, 5, 7]) {
        const shares = allocateEqually(amount, n);
        expect(shares).toHaveLength(n);
        expect(sum(shares)).toBe(amount);
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("allocateByWeights", () => {
  it("allocates proportionally and sums exactly", () => {
    expect(allocateByWeights(1000, [600, 300, 100])).toEqual([600, 300, 100]);
  });

  it("uses largest-remainder for uneven proportions", () => {
    expect(allocateByWeights(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("falls back to an equal split when all weights are zero", () => {
    expect(allocateByWeights(10, [0, 0, 0])).toEqual([4, 3, 3]);
  });

  it("handles a zero amount", () => {
    expect(allocateByWeights(0, [5, 3, 2])).toEqual([0, 0, 0]);
  });

  it("rejects negative and non-integer amounts", () => {
    expect(() => allocateByWeights(-1, [1])).toThrow();
    expect(() => allocateByWeights(1.5, [1])).toThrow();
  });

  it("property: random proportional allocations always sum exactly", () => {
    let seed = 42;
    const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let t = 0; t < 1000; t++) {
      const n = 1 + Math.floor(rand() * 6);
      const amount = Math.floor(rand() * 100000);
      const weights = Array.from({ length: n }, () => Math.floor(rand() * 1000));
      expect(sum(allocateByWeights(amount, weights))).toBe(amount);
    }
  });
});
