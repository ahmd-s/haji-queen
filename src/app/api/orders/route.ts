import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  hasAllowedPublicOrigin,
  originErrorResponse,
  rateLimit,
  rateLimitResponse,
  requestIp,
} from "@/lib/security";
import { serviceErrorResponse } from "@/lib/services/errors";
import { createOrder, orderSchema } from "@/lib/services/order";

/**
 * Order creation transport. Pricing, availability, stock, idempotency and
 * snapshots are owned by OrderService; this route only validates and maps
 * results/errors to HTTP.
 */
export async function POST(req: NextRequest) {
  if (!hasAllowedPublicOrigin(req)) return originErrorResponse();
  if (!rateLimit(`orders:${requestIp(req)}`, 6, 10 * 60 * 1000)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(parsed.data, {
      idempotencyKey: req.headers.get("idempotency-key"),
    });

    await writeAudit(req, {
      action: "ORDER_PLACED",
      entityType: "Order",
      entityId: order.orderId,
      metadata: {
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    return serviceErrorResponse(error, "Could not place your order. Please try again.");
  }
}
