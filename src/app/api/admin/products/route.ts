import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { listAdminProducts } from "@/lib/services/admin-lists";
import { adminProductWriteSchema, assertPublishable } from "@/lib/admin-product";
import {
  recalculateProductStock,
  syncProductVariants,
  variantConflictMessage,
} from "@/lib/services/product-admin";
import { isPrismaUniqueError, serviceErrorResponse } from "@/lib/services/errors";

async function uniqueSku(slug: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = `HQ-${slug.slice(0, 10).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const taken = await db.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `HQ-${slug.slice(0, 8).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/** GET — admin catalogue with bounded pagination and search. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const page = await listAdminProducts(req.nextUrl.searchParams);
  return NextResponse.json({ products: page.items, pagination: page.pagination });
}

/** POST — create a product and its size × colour variants. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;

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
  if (await db.product.findUnique({ where: { slug: d.slug }, select: { id: true } })) {
    return NextResponse.json(
      { error: "That web address is already used.", issues: { slug: ["Choose a different link."] } },
      { status: 400 }
    );
  }

  try {
    if (d.visible) assertPublishable(d);
  } catch (error) {
    return serviceErrorResponse(error, "Could not validate the product.");
  }

  let productId: string;
  try {
    productId = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
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
          stock: 0,
          priceConfirmed: d.priceConfirmed,
          trackStock: d.trackStock,
          availability: d.availability,
          isEnquiryOnly: d.isEnquiryOnly,
          customSizingAllowed: d.customSizingAllowed,
          readyToDispatch: d.readyToDispatch,
          preorderAllowed: d.preorderAllowed,
          sku: await uniqueSku(d.slug),
          ...(d.visible
            ? { publishedAt: new Date(), publishedBy: guard.admin.id }
            : {}),
        },
      });

      await syncProductVariants(tx, product.id, d, d.stock, guard.admin.id);
      await recalculateProductStock(tx, product.id);
      return product.id;
    });
  } catch (error) {
    if (isPrismaUniqueError(error, "slug")) {
      return NextResponse.json(
        { error: "That web address is already used.", issues: { slug: ["Choose a different link."] } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: variantConflictMessage(error, "Could not create the product.") },
      { status: 400 }
    );
  }

  await writeAudit(req, {
    action: "PRODUCT_CREATE",
    entityType: "Product",
    entityId: productId,
    metadata: { slug: d.slug, name: d.name, visible: d.visible },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true, id: productId });
}
