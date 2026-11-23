import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contactPerson: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  catalogName: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/** GET — suppliers with catalogue entries (INTERNAL data — admin only) */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const suppliers = await db.supplier.findMany({
    include: {
      catalogueEntries: { include: { product: { select: { slug: true, price: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ suppliers });
}

/** POST — create supplier */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the supplier details." }, { status: 400 });
  }
  const d = parsed.data;
  const supplier = await db.supplier.create({
    data: {
      name: d.name,
      contactPerson: d.contactPerson || null,
      phone: d.phone || null,
      email: d.email || null,
      catalogName: d.catalogName || null,
      notes: d.notes || null,
      isActive: d.isActive ?? true,
    },
  });
  await writeAudit(req, {
    action: "SUPPLIER_CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    metadata: { name: d.name },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true, id: supplier.id });
}
