/** Money helpers — the store operates in INR (₹). */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Compute suggested retail from wholesale + percentage/fixed markup (internal only). */
export function computeRetail(wholesalePrice: number, markupPct: number, fixedMarkup: number): number {
  const raw = wholesalePrice * (1 + markupPct / 100) + fixedMarkup;
  return Math.ceil(raw);
}
