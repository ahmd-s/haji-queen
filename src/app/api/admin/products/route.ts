import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens"),
  description: z.string().trim().min(10),
  fabricDetails: z.string().trim().max(500).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  source: z.enum(["HQ_ORIGINAL", "TRUSTED_SUPPLIER"]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  colors: z.array(z.object({ name: z.string().min(1), hex: z.string().min(4) })).max(12),
  sizes: z.array(z.string().min(1).max(10)).max(12),
  images: z.array(z.string().min(1)).max(8),
  badge: z.string().trim().max(30).optional().or(z.literal("")),
  featured: z.boolean(),
  visible: z.boolean(),
  stock: z.number().int().min(0).max(999),
});

/** GET — list all products (admin view, includes hidden) */
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  const products = await db.product.findMany({
    include: { category: true, catalogueEntry: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      categoryName: p.category.name,
      categoryId: p.categoryId,
      source: p.source,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      colors: JSON.parse(p.colors || "[]"),
      sizes: JSON.parse(p.sizes || "[]"),
      images: JSON.parse(p.images || "[]"),
      badge: p.badge,
      featured: p.featured,
      visible: p.visible,
      stock: p.stock,
      description: p.description,
      fabricDetails: p.fabricDetails,
      careInstructions: p.careInstructions,
      supplierEntry: p.catalogueEntry
        ? {
            supplierName: p.catalogueEntry.supplier.name,
            // Internal-only fields — admin scope
            wholesalePrice: p.catalogueEntry.wholesalePrice,
            markupPct: p.catalogueEntry.markupPct,
          }
        : null,
    })),
  });
}

/** POST — create product (with variants) */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return NextResponse.json({ error: "Invalid category." }, { status: 400 });

  try {
    const product = await db.product.create({
      data: {
        name: d.name,
        slug: d.slug,
        description: d.description,
        fabricDetails: d.fabricDetails || null,
        careInstructions: d.careInstructions || null,
        categoryId: d.categoryId,
        source: d.source,
        price: d.price,
        compareAtPrice: d.compareAtPrice ?? null,
        colors: JSON.stringify(d.colors),
        sizes: JSON.stringify(d.sizes),
        images: JSON.stringify(d.images),
        badge: d.badge || null,
        featured: d.featured,
        visible: d.visible,
        stock: d.stock,
        sku: `HQ-${d.slug.slice(0, 6).toUpperCase()}`,
      },
    });
    // Create variants distributed across stock
    const per = d.sizes.length * d.colors.length;
    const each = per > 0 ? Math.max(0, Math.floor(d.stock / per)) : 0;
    for (const c of d.colors) {
      for (const s of d.sizes) {
        await db.productVariant.create({
          data: { productId: product.id, size: s, color: c.name, stock: each },
        });
      }
    }
    return NextResponse.json({ ok: true, id: product.id });
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique")
      ? "A product with that slug already exists."
      : "Could not create the product.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
