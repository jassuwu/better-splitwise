import type { Receipt } from '@repo/split-core';

// A tiny in-memory hand-off for a scanned receipt between the Add and Assign
// screens (route params can't carry a structured object).
let pending: Receipt | null = null;

export function setPendingReceipt(receipt: Receipt | null): void {
  pending = receipt;
}

export function getPendingReceipt(): Receipt | null {
  return pending;
}
