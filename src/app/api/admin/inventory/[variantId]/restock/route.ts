import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { recalculateProductStock } from "@/lib/services/product-admin";
import { ServiceError, serviceErrorResponse } from "@/lib/services/errors";

const schema = z.object({
  delta: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 9999, {
    message: "Enter a whole number between -9,999 and 9,999 (not zero).",
  }),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

type RouteCtx = { params: Promise<{ variantId: string }> };

/** POST — atomically adjust variant stock and write a stock movement. */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { variantId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid quantity." },
      { status: 400 }
    );
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          id: true,
          productId: true,
          stock: true,
          size: true,
          color: true,
          product: { select: { name: true } },
        },
      });
      if (!variant) throw new ServiceError("NOT_FOUND", "Stock item not found.");

      const next = variant.stock + parsed.data.delta;
      if (next < 0) {
        throw new ServiceError(
          "VALIDATION",
          `Only ${variant.stock} unit${variant.stock === 1 ? "" : "s"} available to remove.`
        );
      }

      const claimed = await tx.productVariant.updateMany({
        where: { id: variantId, stock: variant.stock },
        data: { stock: next },
      });
      if (claimed.count !== 1) {
        throw new ServiceError(
          "CONFLICT",
          "Stock changed while you were editing. Refresh and try again."
        );
      }

      await tx.stockMovement.create({
        data: {
          productId: variant.productId,
          variantId,
          delta: parsed.data.delta,
          reason: parsed.data.delta > 0 ? "RESTOCK" : "MANUAL_ADJUSTMENT",
          actorId: guard.admin.id,
          note: parsed.data.note || null,
        },
      });
      const productStock = await recalculateProductStock(tx, variant.productId);

      return {
        variantId,
        previousStock: variant.stock,
        stock: next,
        productStock,
        label: `${variant.product.name} — ${variant.color} / ${variant.size}`,
      };
    });

    await writeAudit(req, {
      action: "INVENTORY_STOCK_ADJUST",
      entityType: "ProductVariant",
      entityId: variantId,
      metadata: {
        delta: parsed.data.delta,
        previousStock: result.previousStock,
        stock: result.stock,
        note: parsed.data.note || null,
      },
      actor: guard.admin,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return serviceErrorResponse(error, "Could not update stock.");
  }
}
