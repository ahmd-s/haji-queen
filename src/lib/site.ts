/** Shared site configuration read from environment (never hardcode business data). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = "Haji Queens";
export const SITE_TAGLINE = "By Hazera Khawaja";

export const SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_SHIPPING_FEE || 99);
export const FREE_SHIPPING_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 4999
);
/** Online payment stays disabled until a real Razorpay key is configured. */
export const RAZORPAY_ENABLED = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
