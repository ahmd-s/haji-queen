/**
 * Storefront presentation rules. Nothing here changes catalogue data: it decides
 * how existing records are ordered, cropped and described to customers.
 */
import dimensions from "@/lib/photo-dimensions.json";
import { AVAILABILITY_LABEL, normaliseAvailability } from "@/lib/availability";
import type { CategoryDTO, ColorOption, ProductDTO } from "@/lib/types";

const DIMENSIONS = dimensions as Record<string, number[]>;

/* ───────────── Photography ───────────── */

/** Width / height of a known photo; the catalogue default is 3:4 portrait. */
export function photoRatio(src: string | undefined): number {
  const d = src ? DIMENSIONS[src] : undefined;
  return d ? d[0] / d[1] : 3 / 4;
}

export function photoSize(src: string): { width: number; height: number } {
  const d = DIMENSIONS[src];
  return d ? { width: d[0], height: d[1] } : { width: 1086, height: 1448 };
}

/** Keeps the garment in frame when a photo has to be cropped. */
export function photoPosition(src: string | undefined): string | undefined {
  if (!src) return undefined;
  // This file carries a black strip along its bottom edge.
  if (src.endsWith("pinafore-shirt-maroon-white.webp")) return "50% 0%";
  const ratio = photoRatio(src);
  if (ratio > 0.97) return "60% 50%"; // square flat lays: keep the top whole
  return ratio < 0.74 ? "50% 12%" : undefined;
}

/** Photos of one colour, or the product's own photos when none are assigned. */
export function colourPhotos(product: ProductDTO, colour?: ColorOption): string[] {
  return colour?.images?.length ? colour.images : product.images;
}

/** Starter images that shipped with the site template; not Haji Queens photography. */
const TEMPLATE_IMAGE = /^\/images\/(hero-main|story-|cat-|banner-|ig-)/;

export function ownImage(src: string | null | undefined): string | null {
  return src && !TEMPLATE_IMAGE.test(src) ? src : null;
}

/** Sample listings from the original build, recognisable by their template photos. */
export function isSampleListing(p: ProductDTO): boolean {
  return /^\/images\/p-/.test(p.images[0] ?? "");
}

const P = "/images/products";
const CATEGORY_PHOTO: Record<string, string> = {
  abayas: `${P}/luxury-organza-shrug-style-abaya/luxury-organza-shrug-style-abaya-taupe.webp`,
  "maxis-dresses": `${P}/shirt-with-pinafore/shirt-with-pinafore-black-red-1.webp`,
  "indo-western": `${P}/elegant-coat-set/elegant-coat-set-mehndi-green.webp`,
  "corporate-workwear": "/images/p-tailored-workwear-1.jpg",
};

export const EDITORIAL = {
  measure: `${P}/skirt-with-top/skirt-with-top-white-blush-pink-2.webp`,
  story: `${P}/skirt-with-top/skirt-with-top-white-blush-pink-3.webp`,
  storyPortrait: `${P}/skirt-with-top/skirt-with-top-white-blush-pink-1.webp`,
  storyDetail: `${P}/shirt-with-pinafore/shirt-with-pinafore-black-red-4.webp`,
  storyRoom: `${P}/pinafore-shirt/pinafore-shirt-brown-cream.webp`,
};

/** An owner-uploaded tile always wins; otherwise a real catalogue photo. */
export function categoryPhoto(c: CategoryDTO): string | null {
  return ownImage(c.tileImage) ?? CATEGORY_PHOTO[c.slug] ?? null;
}

const SHORT_NAME: Record<string, string> = {
  "maxis-dresses": "Maxis",
  "indo-western": "Indo-Western",
  "corporate-workwear": "Workwear",
};
export function categoryLabel(c: { slug: string; name: string }): string {
  return SHORT_NAME[c.slug] ?? c.name;
}

/* ───────────── Merchandising ───────────── */

/** Real catalogue first, then sample listings, then pieces awaiting photographs. */
export function merchandise(products: ProductDTO[]): ProductDTO[] {
  const rank = (p: ProductDTO) => (p.images.length === 0 ? 2 : isSampleListing(p) ? 1 : 0);
  return [...products].sort((a, b) => rank(a) - rank(b));
}

export function newArrivals(products: ProductDTO[]): ProductDTO[] {
  return products.filter((p) => !isSampleListing(p) && p.images.length > 0);
}

/** "Bestseller" is not shown: there is no sales data behind it yet. */
export function displayBadge(p: ProductDTO): string | null {
  return p.badge && !/best\s*seller/i.test(p.badge) ? p.badge : null;
}

export function hasPrice(p: { priceConfirmed: boolean; price: number }): boolean {
  return p.priceConfirmed && p.price > 0;
}

export function isSoldOut(p: ProductDTO): boolean {
  return p.trackStock && p.stock <= 0;
}

/** One short, truthful status for cards and product pages. */
export function statusLabel(p: ProductDTO): string {
  if (isSoldOut(p)) return "Sold out";
  if (!p.purchasable) return "Order by enquiry";
  return AVAILABILITY_LABEL[normaliseAvailability(p.availability)];
}

export function enquiryNote(p: ProductDTO): string {
  if (isSoldOut(p)) return "This piece is sold out. Send us a note and we will tell you if it returns.";
  if (!hasPrice(p)) return "The price for this piece is being confirmed. Ask us and we will share it with you.";
  if (p.sizes.length === 0)
    return "We confirm the size for this piece with you personally, so it is ordered by enquiry.";
  return `${p.unavailableReason ?? "This piece is ordered by enquiry"}. Ask us and we will help you order it.`;
}

/* ───────────── Colour families (for filtering) ───────────── */

export type ColourFamily = { name: string; swatch: string };
export const COLOUR_FAMILIES: ColourFamily[] = [
  { name: "Black", swatch: "#17161a" },
  { name: "White & ivory", swatch: "#f3ece0" },
  { name: "Brown & beige", swatch: "#8a6a50" },
  { name: "Grey", swatch: "#8c8a88" },
  { name: "Wine & red", swatch: "#6f1a2c" },
  { name: "Pink", swatch: "#c98f9b" },
  { name: "Gold & mustard", swatch: "#b98b2f" },
  { name: "Green", swatch: "#4c5a3c" },
  { name: "Blue", swatch: "#26345c" },
  { name: "Purple", swatch: "#5b3a63" },
];

/** Colour names are the reliable signal; hue is the fallback. */
const FAMILY_BY_NAME: [RegExp, string][] = [
  [/teal|navy|blue|indigo/i, "Blue"],
  [/wine|maroon|burgundy|\bred\b|terracotta/i, "Wine & red"],
  [/pink|blush|rose|mauve/i, "Pink"],
  [/mustard|marigold|gold\b/i, "Gold & mustard"],
  [/olive|green|mehndi|sage/i, "Green"],
  [/plum|purple/i, "Purple"],
  [/gr[ae]y/i, "Grey"],
  [/black/i, "Black"],
  [/ivory|white|pearl|cream/i, "White & ivory"],
  [/brown|coffee|biscuit|camel|tan\b|taupe|beige|espresso|champagne/i, "Brown & beige"],
];

function familyFromHex(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "Brown & beige";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const l = max - d / 2;
  if (l < 0.13) return "Black";
  if (l > 0.85) return "White & ivory";
  if (d < 0.07) return "Grey";
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 15 && h < 70) return "Brown & beige";
  if (h < 170) return h < 15 ? "Wine & red" : "Green";
  if (h < 255) return "Blue";
  if (h < 315) return "Purple";
  return l > 0.5 ? "Pink" : "Wine & red";
}

export function colourFamilies(c: ColorOption): string[] {
  const parts = c.name.split("/");
  return [
    ...new Set(
      parts.map(
        (part, i) =>
          FAMILY_BY_NAME.find(([re]) => re.test(part))?.[1] ??
          familyFromHex(i === 0 ? c.hex : (c.hex2 ?? c.hex))
      )
    ),
  ];
}

export function swatchBackground(c: { hex: string; hex2?: string }): string {
  return c.hex2 ? `linear-gradient(135deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)` : c.hex;
}

/* ───────────── Owner-edited content: never show unfinished placeholders ───────────── */

export type Award = { title: string; detail: string; year: string };
export function verifiedAwards(awards: Award[]): Award[] {
  return awards.filter(
    (a) => a.title && !/placeholder|\[/i.test(a.detail ?? "") && !/x/i.test(a.year ?? "")
  );
}

export type ContactContent = { email?: string; phoneDisplay?: string; address?: string; hours?: string };
export function publicContact(c: ContactContent): ContactContent {
  return {
    email: c.email || undefined,
    phoneDisplay: c.phoneDisplay && !/0000\s?0000/.test(c.phoneDisplay) && !/00000$/.test(c.phoneDisplay)
      ? c.phoneDisplay
      : undefined,
    address: c.address?.replace(/\s*\[[^\]]*\]/g, "").trim() || undefined,
    hours: c.hours?.replace(/\s*\[[^\]]*\]/g, "").trim() || undefined,
  };
}
