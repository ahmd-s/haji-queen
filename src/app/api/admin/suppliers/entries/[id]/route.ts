import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";

const updateSchema = z.object({
  supplierRef: z.string().trim().max(60).nullable().optional(),
  itemName: z.string().trim().min(2).max(120).optional(),
  wholesalePrice: z.number().positive().optional(),
  markupPct: z.number().min(0).max(500).optional(),
  fixedMarkup: z.number().min(0).optional(),
  availability: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"]).optional(),
  notes: z.string().trim().max(600).nullable().optional(),
  productId: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
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
    return NextResponse.json({ error: "Please check the entry details." }, { status: 400 });
  }
  await db.supplierCatalogueEntry.update({ where: { id }, data: parsed.data });
  await writeAudit(req, {
    action: "SUPPLIER_ENTRY_UPDATE",
    entityType: "SupplierCatalogueEntry",
    entityId: id,
    metadata: { updatedFields: Object.keys(parsed.data) },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  await db.supplierCatalogueEntry.delete({ where: { id } });
  await writeAudit(req, {
    action: "SUPPLIER_ENTRY_DELETE",
    entityType: "SupplierCatalogueEntry",
    entityId: id,
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true });
}
