import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import type { StockMovementRow } from "@/lib/admin-types";

type RouteCtx = { params: Promise<{ variantId: string }> };

/** GET — movement history for one variant (who, when, how much, why). */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { variantId } = await ctx.params;

  const rows = await db.stockMovement.findMany({
    where: { variantId },
    include: {
      variant: { select: { size: true, color: true, product: { select: { name: true } } } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const movements: StockMovementRow[] = rows.map((m) => ({
    id: m.id,
    variantId: m.variantId,
    productId: m.productId,
    productName: m.variant.product.name,
    size: m.variant.size,
    color: m.variant.color,
    delta: m.delta,
    reason: m.reason,
    actorId: m.actorId,
    note: m.note,
    orderNumber: m.order?.orderNumber ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ movements });
}
