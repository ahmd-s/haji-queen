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
import { lookupOrder, orderLookupSchema } from "@/lib/services/order";

/** Order tracking lookup — requires both order number and matching contact. */
export async function POST(req: NextRequest) {
  if (!hasAllowedPublicOrigin(req)) return originErrorResponse();
  if (!rateLimit(`order-lookup:${requestIp(req)}`, 12, 60 * 1000)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = orderLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your order number and email or phone." }, { status: 400 });
  }

  try {
    const result = await lookupOrder(parsed.data);
    await writeAudit(req, {
      action: "ORDER_LOOKUP",
      entityType: "Order",
      entityId: result.orderId,
    }).catch(() => undefined);
    return NextResponse.json({ order: result.order });
  } catch (error) {
    return serviceErrorResponse(error, "Could not look up your order. Please try again.");
  }
}
