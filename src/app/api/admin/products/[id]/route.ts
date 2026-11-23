import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { adminProductWriteSchema, assertPublishable } from "@/lib/admin-product";
import {
  recalculateProductStock,
  syncProductVariants,
  variantConflictMessage,
} from "@/lib/services/product-admin";
import { isPrismaUniqueError, serviceErrorResponse } from "@/lib/services/errors";

type RouteCtx = { params: Promise<{ id: string }> };

/** PUT — full owner-friendly product edit, including variants and publish state. */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = adminProductWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const category = await db.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Choose a valid category.", issues: { categoryId: ["Choose a category."] } },
      { status: 400 }
    );
  }

  if (d.slug !== existing.slug) {
    const clash = await db.product.findUnique({
      where: { slug: d.slug },
      select: { id: true },
    });
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: "That web address is already used.", issues: { slug: ["Choose a different link."] } },
        { status: 400 }
      );
    }
  }

  const legacyEnquiryOnly =
    !existing.priceConfirmed && existing.catalogueBatch === "MASTER_V1_1";
  try {
    if (d.visible) assertPublishable(d, legacyEnquiryOnly);
  } catch (error) {
    return serviceErrorResponse(error, "Could not validate the product.");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
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
          sizeNotes: d.sizeNotes || null,
          badge: d.badge || null,
          featured: d.featured,
          visible: d.visible,
          priceConfirmed: d.priceConfirmed,
          trackStock: d.trackStock,
          availability: d.availability,
          isEnquiryOnly: d.isEnquiryOnly,
          customSizingAllowed: d.customSizingAllowed,
          readyToDispatch: d.readyToDispatch,
          preorderAllowed: d.preorderAllowed,
          ...(d.visible && !existing.visible
            ? { publishedAt: new Date(), publishedBy: guard.admin.id }
            : {}),
          ...(!d.visible ? { publishedAt: null, publishedBy: null } : {}),
        },
      });

      await syncProductVariants(tx, id, d, existing.stock, guard.admin.id);
      await recalculateProductStock(tx, id);
    });
  } catch (error) {
    if (isPrismaUniqueError(error, "slug")) {
      return NextResponse.json(
        { error: "That web address is already used.", issues: { slug: ["Choose a different link."] } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: variantConflictMessage(error, "Could not update the product.") },
      { status: 400 }
    );
  }

  await writeAudit(req, {
    action: "PRODUCT_UPDATE",
    entityType: "Product",
    entityId: id,
    metadata: {
      slug: d.slug,
      visible: d.visible,
      priceConfirmed: d.priceConfirmed,
      isEnquiryOnly: d.isEnquiryOnly,
    },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true });
}

/** DELETE — remove a product; order snapshots are preserved. */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await db.product.delete({ where: { id } });
  await writeAudit(req, {
    action: "PRODUCT_DELETE",
    entityType: "Product",
    entityId: id,
    metadata: { name: existing.name, slug: existing.slug },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true });
}
