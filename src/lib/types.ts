/** Shared types used across server data layer and client components. */

export type ColorOption = {
  name: string;
  hex: string;
  /** Second tone for two-piece sets (e.g. skirt / top). */
  hex2?: string;
  /** Photos of this exact colour; the gallery jumps to these on selection. */
  images?: string[];
  /** false = shown but not purchasable. Defaults to true. */
  available?: boolean;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  fabricDetails: string | null;
  careInstructions: string | null;
  category: { slug: string; name: string };
  source: "HQ_ORIGINAL" | "TRUSTED_SUPPLIER";
  price: number;
  compareAtPrice: number | null;
  colors: ColorOption[];
  sizes: string[];
  images: string[];
  badge: string | null;
  featured: boolean;
  stock: number;
  inStock: boolean;
  /** false = selling price pending approval; `price` must not be displayed. */
  priceConfirmed: boolean;
  trackStock: boolean;
  availability: string;
  sizeNotes: string | null;
  /** Price confirmed, sizes known, available — see lib/availability. */
  purchasable: boolean;
  /** Only true for admin previews of unpublished products. */
  preview?: boolean;
};

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  bannerImage: string | null;
  tileImage: string | null;
};

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
