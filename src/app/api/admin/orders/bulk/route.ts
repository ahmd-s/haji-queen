import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { ORDER_NEXT_STATUSES } from "@/lib/admin-labels";
import { db } from "@/lib/db";
import { isServiceError, serviceErrorResponse } from "@/lib/services/errors";
import { updateOrderStatus } from "@/lib/services/order";

const schema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(50),
  status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

/** PATCH — move several orders through the same allowed next step. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Select orders and a valid status." }, { status: 400 });
  }

  const orders = await db.order.findMany({
    where: { id: { in: parsed.data.ids } },
    select: { id: true, orderNumber: true, status: true },
  });
  const byId = new Map(orders.map((o) => [o.id, o]));
  const updated: string[] = [];
  const skipped: { id: string; orderNumber: string; reason: string }[] = [];

  for (const id of parsed.data.ids) {
    const order = byId.get(id);
    if (!order) continue;
    if (order.status === parsed.data.status) {
      updated.push(id);
      continue;
    }
    if (!(ORDER_NEXT_STATUSES[order.status] ?? []).includes(parsed.data.status)) {
      skipped.push({
        id,
        orderNumber: order.orderNumber,
        reason: `Cannot move ${order.status.toLowerCase()} orders directly to ${parsed.data.status.toLowerCase()}.`,
      });
      continue;
    }
    try {
      await updateOrderStatus(id, { status: parsed.data.status }, guard.admin.id);
      updated.push(id);
    } catch (error) {
      skipped.push({
        id,
        orderNumber: order.orderNumber,
        reason: isServiceError(error) ? error.message : "Could not update this order.",
      });
    }
  }

  await writeAudit(req, {
    action: "ORDER_BULK_STATUS_UPDATE",
    entityType: "Order",
    metadata: {
      status: parsed.data.status,
      requested: parsed.data.ids.length,
      updated: updated.length,
      skipped: skipped.length,
    },
    actor: guard.admin,
  });

  return NextResponse.json({ ok: true, updated, skipped });
}

export function orderBulkErrorResponse(error: unknown) {
  return serviceErrorResponse(error, "Could not update the selected orders.");
}
