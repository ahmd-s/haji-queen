import { db } from "@/lib/db";
import { parseJson, type CategoryDTO, type ProductDTO } from "@/lib/types";
import type { Category, Product } from "@prisma/client";

/**
 * Server-side data access for the storefront.
 * SECURITY: this module never selects supplier costs, wholesale prices or
 * margins — those live only in admin-scoped queries.
 */

export function toProductDTO(p: Product & { category: Category }): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    fabricDetails: p.fabricDetails,
    careInstructions: p.careInstructions,
    category: { slug: p.category.slug, name: p.category.name },
    source: p.source === "TRUSTED_SUPPLIER" ? "TRUSTED_SUPPLIER" : "HQ_ORIGINAL",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    colors: parseJson<{ name: string; hex: string }[]>(p.colors, []),
    sizes: parseJson<string[]>(p.sizes, []),
    images: parseJson<string[]>(p.images, []),
    badge: p.badge,
    featured: p.featured,
    stock: p.stock,
    inStock: p.stock > 0,
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
  const where: Parameters<typeof db.product.findMany>[0]["where"] = { visible: true };
  if (q.category) where.category = { slug: q.category };
  if (q.featuredOnly) where.featured = true;
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { description: { contains: q.search } },
      { category: { name: { contains: q.search } } },
    ];
  }
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.price = {
      ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
    };
  }
  if (q.inStock) where.stock = { gt: 0 };

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
    include: { category: true },
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

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const row = await db.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!row || !row.visible) return null;
  return toProductDTO(row);
}

export async function getRelatedProducts(product: ProductDTO, limit = 4): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: { visible: true, categoryId: { not: undefined }, category: { slug: product.category.slug }, id: { not: product.id } },
    include: { category: true },
    take: limit,
    orderBy: { popularity: "desc" },
  });
  if (rows.length >= limit) return rows.map(toProductDTO);
  const fill = await db.product.findMany({
    where: { visible: true, featured: true, id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    include: { category: true },
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
