/**
 * Purchasability rules shared by the storefront, cart and order API.
 *
 * Legacy products (trackStock = true) follow stock quantities exactly as before.
 * Catalogue products without known quantities (trackStock = false) follow their
 * availability status instead — no inventory numbers are invented.
 */

export const AVAILABILITY = ["IN_STOCK", "READY_TO_DISPATCH", "PRE_ORDER", "UNAVAILABLE"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  IN_STOCK: "In stock",
  READY_TO_DISPATCH: "Ready to dispatch",
  PRE_ORDER: "Pre-order",
  UNAVAILABLE: "Currently unavailable",
};

export function normaliseAvailability(v: string | null | undefined): Availability {
  return (AVAILABILITY as readonly string[]).includes(v ?? "") ? (v as Availability) : "IN_STOCK";
}

type Sellable = {
  price: number;
  priceConfirmed: boolean;
  trackStock: boolean;
  availability: string;
  stock: number;
  sizes: string[];
};

/** Can this product be added to the bag at all (any variant)? */
export function isPurchasable(p: Sellable): boolean {
  if (!p.priceConfirmed || p.price <= 0) return false;
  if (p.sizes.length === 0) return false;
  const a = normaliseAvailability(p.availability);
  if (a === "UNAVAILABLE") return false;
  return p.trackStock ? p.stock > 0 : true;
}

/** Why a product can't be bought — customer-facing wording. */
export function unavailableReason(p: Sellable): string | null {
  if (!p.priceConfirmed || p.price <= 0) return "Price to be announced";
  if (p.sizes.length === 0) return "Sizes to be confirmed";
  const a = normaliseAvailability(p.availability);
  if (a === "UNAVAILABLE") return "Currently unavailable";
  if (p.trackStock && p.stock <= 0) return "Sold out";
  return null;
}
