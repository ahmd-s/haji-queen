/** Shared types used across server data layer and client components. */

export type ColorOption = { name: string; hex: string };

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
