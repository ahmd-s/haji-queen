import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "SCHEDULED", "COMPLETED", "ARCHIVED"]).optional(),
  internalNotes: z.string().trim().max(1000).nullable().optional(),
});

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
    return NextResponse.json({ error: "Invalid values." }, { status: 400 });
  }
  const inquiry = await db.measurementInquiry.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, status: inquiry.status });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  await db.measurementInquiry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
