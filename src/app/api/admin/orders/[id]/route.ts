import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { serviceErrorResponse } from "@/lib/services/errors";
import { orderPatchSchema, updateOrderStatus } from "@/lib/services/order";

/** GET — order detail with purchased snapshots. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      shippingRule: { select: { name: true, flatFee: true, freeThreshold: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

/** PATCH — status/payment updates via OrderService (restocks on cancellation). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = orderPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status values." }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, parsed.data, guard.admin.id);
    await writeAudit(req, {
      action: "ORDER_STATUS_UPDATE",
      entityType: "Order",
      entityId: id,
      metadata: { status: order.status, paymentStatus: order.paymentStatus },
      actor: guard.admin,
    });
    return NextResponse.json({ ok: true, status: order.status, paymentStatus: order.paymentStatus });
  } catch (error) {
    return serviceErrorResponse(error, "Could not update the order.");
  }
}
