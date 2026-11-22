import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

/**
 * Per-product admin operations (edit / delete).
 * The UI's Edit and Delete actions post here — without this route those
 * buttons previously failed with 405/404.
 */

const productUpdateSchema = z.object({
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
  // Pending-approval products may stay at 0 while hidden, but the publish
  // guard below blocks any visible product without a confirmed price.
  price: z.number().min(0),
  compareAtPrice: z.number().positive().nullable().optional(),
  colors: z.array(z.object({ name: z.string().min(1), hex: z.string().min(4) })).max(12),
  sizes: z.array(z.string().min(1).max(10)).max(12),
  images: z.array(z.string().min(1)).max(12),
  badge: z.string().trim().max(30).optional().or(z.literal("")),
  featured: z.boolean(),
  visible: z.boolean(),
  stock: z.number().int().min(0).max(999),
});

type RouteCtx = { params: Promise<{ id: string }> };

/** PUT — update an existing product (incl. publish/unpublish, price, images). */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return NextResponse.json({ error: "Invalid category." }, { status: 400 });

  // ── Publish approval guard ────────────────────────────────────────────
  // A product may be saved hidden in its pending state (price 0, no images),
  // but it cannot go live until every customer-facing essential is approved.
  if (d.visible) {
    const blockers: string[] = [];
    if (d.price <= 0) blockers.push("a confirmed selling price");
    if (d.images.length === 0) blockers.push("at least one product image");
    if (d.description.trim().length < 10) blockers.push("a complete description");
    if (blockers.length) {
      return NextResponse.json(
        {
          error: `Cannot publish — pending approval: add ${blockers.join(" and ")}. Save it hidden while you finish the review, then publish.`,
        },
        { status: 400 }
      );
    }
  }

  try {
    await db.product.update({
      where: { id },
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
      },
    });

    // Keep variants in step with the edited size × colour matrix.
    const wanted = new Set<string>();
    for (const c of d.colors) {
      for (const s of d.sizes) wanted.add(`${s}\u0000${c.name}`);
    }
    // When colours are pending (empty list), keep single-size variants keyed by size only.
    if (d.colors.length === 0) {
      for (const s of d.sizes) wanted.add(`${s}\u0000`);
    }
    const current = await db.productVariant.findMany({ where: { productId: id } });
    const toDelete = current.filter((v) => !wanted.has(`${v.size}\u0000${v.color}`));
    await Promise.all(toDelete.map((v) => db.productVariant.delete({ where: { id: v.id } })));
    const have = new Set(current.map((v) => `${v.size}\u0000${v.color}`));
    for (const key of wanted) {
      if (have.has(key)) continue;
      const [size, color] = key.split("\u0000");
      await db.productVariant.create({ data: { productId: id, size, color, stock: 0 } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "A product with that slug already exists."
        : "Could not update the product.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE — remove a product (admin action; cascade variants, keep orders). */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
