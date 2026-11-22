import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const patchSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]).optional(),
  internalNotes: z.string().trim().max(600).nullable().optional(),
});

/** GET — order detail */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

/** PATCH — update status / payment status / internal notes */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status values." }, { status: 400 });
  }
  const order = await db.order.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, status: order.status, paymentStatus: order.paymentStatus });
}
