import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  contactPerson: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  catalogName: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(600).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the supplier details." }, { status: 400 });
  }
  try {
    await db.supplier.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Supplier not found." }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const entries = await db.supplierCatalogueEntry.count({ where: { supplierId: id } });
  if (entries > 0) {
    return NextResponse.json(
      { error: "This supplier has catalogue entries. Remove them first." },
      { status: 400 }
    );
  }
  await db.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
