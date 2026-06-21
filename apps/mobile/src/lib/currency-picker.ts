// A tiny bridge so the currency picker-screen can return a value to its opener.
// The opener registers a callback, navigates to /currency, and the picker calls
// commitCurrency(code) on selection before dismissing.
let pending: ((code: string) => void) | null = null;

export function onCurrencyPicked(cb: (code: string) => void): void {
  pending = cb;
}

export function commitCurrency(code: string): void {
  const cb = pending;
  pending = null;
  cb?.(code);
}
