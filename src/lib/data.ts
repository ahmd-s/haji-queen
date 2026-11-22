import { db } from "@/lib/db";
import { parseJson, type CategoryDTO, type ColorOption, type ProductDTO } from "@/lib/types";
import { isPurchasable, unavailableReason, type VariantStock } from "@/lib/availability";
import type { Category, Prisma, Product } from "@prisma/client";

/** Public-facing product include — internal supplier fields are never selected. */
const publicProductInclude = {
  category: true,
  variants: { select: { size: true, color: true, stock: true } },
} as const;

/**
 * Server-side data access for the storefront.
 * SECURITY: this module never selects supplier costs, wholesale prices or
 * margins — those live only in admin-scoped queries.
 */

export function toProductDTO(
  p: Product & { category: Category; variants?: VariantStock[] }
): ProductDTO {
  const sizes = parseJson<string[]>(p.sizes, []);
  const colors = parseJson<ColorOption[]>(p.colors, []).map((c) => ({
    name: c.name,
    hex: c.hex,
    ...(c.hex2 ? { hex2: c.hex2 } : {}),
    ...(c.images?.length ? { images: c.images } : {}),
    available: c.available !== false,
  }));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    fabricDetails: p.fabricDetails,
    careInstructions: p.careInstructions,
    category: { slug: p.category.slug, name: p.category.name },
    source: p.source === "TRUSTED_SUPPLIER" ? "TRUSTED_SUPPLIER" : "HQ_ORIGINAL",
    // A pending price is never sent to the browser.
    price: p.priceConfirmed ? p.price : 0,
    compareAtPrice: p.priceConfirmed ? p.compareAtPrice : null,
    colors,
    sizes,
    images: parseJson<string[]>(p.images, []),
    badge: p.badge,
    featured: p.featured,
    stock: p.stock,
    inStock: p.trackStock ? p.stock > 0 : p.availability !== "UNAVAILABLE",
    priceConfirmed: p.priceConfirmed,
    trackStock: p.trackStock,
    availability: p.availability,
    sizeNotes: p.sizeNotes,
    purchasable: isPurchasable({ ...p, sizes, variants: p.variants }),
    unavailableReason: unavailableReason({ ...p, sizes, variants: p.variants }),
    variants: (p.variants ?? []).map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
  };
}

export type ProductQuery = {
  category?: string;
  search?: string;
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  featuredOnly?: boolean;
  limit?: number;
};

export async function getProducts(q: ProductQuery = {}): Promise<ProductDTO[]> {
  const where: Prisma.ProductWhereInput = { visible: true };
  if (q.category) where.category = { slug: q.category };
  if (q.featuredOnly) where.featured = true;
  if (q.search) {
    where.OR = [
      // Postgres `contains` is case-sensitive by default (SQLite was not).
      { name: { contains: q.search, mode: "insensitive" } },
      { description: { contains: q.search, mode: "insensitive" } },
      { category: { name: { contains: q.search, mode: "insensitive" } } },
    ];
  }
  const and: Prisma.ProductWhereInput[] = [];
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.priceConfirmed = true; // pending prices never match a price range
    where.price = {
      ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
    };
  }
  if (q.inStock) {
    and.push({
      OR: [
        { trackStock: true, stock: { gt: 0 } },
        { trackStock: false, availability: { in: ["READY_TO_DISPATCH", "PRE_ORDER", "IN_STOCK"] } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const orderBy =
    q.sort === "price-asc"
      ? { price: "asc" as const }
      : q.sort === "price-desc"
        ? { price: "desc" as const }
        : q.sort === "popular"
          ? { popularity: "desc" as const }
          : { createdAt: "desc" as const };

  const rows = await db.product.findMany({
    where,
    orderBy: [orderBy],
    include: publicProductInclude,
    ...(q.limit ? { take: q.limit } : {}),
  });

  let items = rows.map(toProductDTO);
  // Post-filters on JSON columns
  if (q.colors?.length) {
    items = items.filter((p) => p.colors.some((c) => q.colors!.includes(c.name)));
  }
  if (q.sizes?.length) {
    items = items.filter((p) => p.sizes.some((s) => q.sizes!.includes(s)));
  }
  return items;
}

export async function getProductBySlug(
  slug: string,
  opts: { allowHidden?: boolean } = {}
): Promise<ProductDTO | null> {
  const row = await db.product.findUnique({
    where: { slug },
    include: publicProductInclude,
  });
  if (!row) return null;
  // Unpublished products are only returned for a verified admin preview.
  if (!row.visible && !opts.allowHidden) return null;
  return { ...toProductDTO(row), ...(row.visible ? {} : { preview: true }) };
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: { visible: true, categoryId: { not: undefined }, category: { slug: product.category.slug }, id: { not: product.id } },
    include: publicProductInclude,
    take: limit,
    orderBy: { popularity: "desc" },
  });
  if (rows.length >= limit) return rows.map(toProductDTO);
  const fill = await db.product.findMany({
    where: { visible: true, featured: true, id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    include: publicProductInclude,
    take: limit - rows.length,
  });
  return [...rows, ...fill].map(toProductDTO);
}

export async function getCategories(): Promise<CategoryDTO[]> {
  const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    bannerImage: c.bannerImage,
    tileImage: c.tileImage,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const c = await db.category.findUnique({ where: { slug } });
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    bannerImage: c.bannerImage,
    tileImage: c.tileImage,
  };
}

/** Editable site content (homepage copy, awards, social links…). */
export async function getContent<T = Record<string, unknown>>(key: string, fallback: T): Promise<T> {
  const row = await db.siteContent.findUnique({ where: { key } });
  if (!row) return fallback;
  return parseJson<T>(row.value, fallback);
}
