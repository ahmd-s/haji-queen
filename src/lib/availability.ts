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

export type VariantStock = { size: string; color: string; stock: number };

type Sellable = {
  price: number;
  priceConfirmed: boolean;
  trackStock: boolean;
  availability: string;
  stock: number;
  sizes: string[];
  variants?: VariantStock[];
};

/** Can this product be added to the bag at all (any variant)? */
export function isPurchasable(p: Sellable): boolean {
  if (!p.priceConfirmed || p.price <= 0) return false;
  if (p.sizes.length === 0) return false;
  // A size-only variant grid is not enough to place an order: colour is an
  // essential purchase detail. Never invent a colour label for these rows.
  if (p.variants?.length && !p.variants.some((v) => v.size && v.color)) return false;
  const a = normaliseAvailability(p.availability);
  if (a === "UNAVAILABLE") return false;
  return p.trackStock ? p.stock > 0 : true;
}

/** Why a product can't be bought — customer-facing wording. */
export function unavailableReason(p: Sellable): string | null {
  if (!p.priceConfirmed || p.price <= 0) return "Price to be announced";
  if (p.sizes.length === 0) return "Sizes to be confirmed";
  if (p.variants?.length && !p.variants.some((v) => v.size && v.color)) return "Colour to be confirmed";
  const a = normaliseAvailability(p.availability);
  if (a === "UNAVAILABLE") return "Currently unavailable";
  if (p.trackStock && p.stock <= 0) return "Sold out";
  return null;
}

/** Find the exact database variant for a selected size/colour. */
export function findVariant(p: Sellable, size: string, color: string): VariantStock | undefined {
  return p.variants?.find((v) => v.size === size && v.color === color);
}

/**
 * Checkout is allowed only for a variant that exists in the database and
 * either has stock (quantity tracked) or an explicit supported pre-order
 * status (quantities not tracked). Never invents availability.
 */
export function isVariantPurchasable(p: Sellable, size: string, color: string): boolean {
  if (!isPurchasable(p)) return false;
  if (!size || !color) return false;
  const variant = findVariant(p, size, color);
  if (!variant) return false;
  if (p.trackStock) return variant.stock > 0;
  return normaliseAvailability(p.availability) !== "UNAVAILABLE";
}

/** Why a specific size/colour cannot be bought — customer-facing wording. */
export function variantUnavailableReason(p: Sellable, size: string, color: string): string | null {
  const productReason = unavailableReason(p);
  if (productReason) return productReason;
  if (!size || !color) return "Choose a size and colour";
  const variant = findVariant(p, size, color);
  if (!variant) return "This size and colour combination is not available";
  if (p.trackStock && variant.stock <= 0) return "This option is sold out";
  return null;
}

/** Quantity ceiling used by the cart. Pre-orders use a safe fixed ceiling. */
export function maxVariantQuantity(p: Sellable, size: string, color: string): number {
  const variant = findVariant(p, size, color);
  if (p.trackStock) return Math.max(0, variant?.stock ?? 0);
  return 10;
}
