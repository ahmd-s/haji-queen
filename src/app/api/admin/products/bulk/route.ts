import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { assertPublishable } from "@/lib/admin-product";
import { parseJson } from "@/lib/types";

const bulkSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
  action: z.enum(["publish", "unpublish"]),
});

/** PATCH — bulk publish/unpublish with the same publish checklist as single edits. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select at least one product." }, { status: 400 });
  }

  const products = await db.product.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { variants: { select: { id: true } } },
  });
  const updated: string[] = [];
  const skipped: { id: string; name: string; reason: string }[] = [];

  for (const product of products) {
    if (parsed.data.action === "publish") {
      const legacyEnquiryOnly =
        !product.priceConfirmed && product.catalogueBatch === "MASTER_V1_1";
      try {
        assertPublishable(
          {
            name: product.name,
            description: product.description,
            price: product.price,
            priceConfirmed: product.priceConfirmed,
            isEnquiryOnly: product.isEnquiryOnly,
            images: parseJson<string[]>(product.images, []),
            sizes: parseJson<string[]>(product.sizes, []),
            colors: parseJson<{ name: string; hex: string }[]>(product.colors, []),
          },
          legacyEnquiryOnly
        );
      } catch (error) {
        skipped.push({
          id: product.id,
          name: product.name,
          reason: error instanceof Error ? error.message : "Not ready to publish.",
        });
        continue;
      }
    }

    await db.product.update({
      where: { id: product.id },
      data:
        parsed.data.action === "publish"
          ? {
              visible: true,
              publishedAt: product.publishedAt ?? new Date(),
              publishedBy: guard.admin.id,
            }
          : { visible: false, publishedAt: null, publishedBy: null },
    });
    updated.push(product.id);
  }

  await writeAudit(req, {
    action: parsed.data.action === "publish" ? "PRODUCT_BULK_PUBLISH" : "PRODUCT_BULK_UNPUBLISH",
    entityType: "Product",
    metadata: { requested: parsed.data.ids.length, updated: updated.length, skipped: skipped.length },
    actor: guard.admin,
  });

  return NextResponse.json({ ok: true, updated, skipped });
}
