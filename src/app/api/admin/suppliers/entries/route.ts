import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { computeRetail } from "@/lib/money";

const entrySchema = z.object({
  supplierId: z.string().min(1),
  supplierRef: z.string().trim().max(60).optional().or(z.literal("")),
  itemName: z.string().trim().min(2).max(120),
  wholesalePrice: z.number().positive(),
  markupPct: z.number().min(0).max(500),
  fixedMarkup: z.number().min(0),
  availability: z.enum(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"]),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
});

/** GET — entries for a supplier */
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const supplierId = req.nextUrl.searchParams.get("supplierId");
  const entries = await db.supplierCatalogueEntry.findMany({
    where: supplierId ? { supplierId } : undefined,
    include: { product: { select: { slug: true, price: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

/** POST — create catalogue entry; suggests retail via markup engine */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the entry details." }, { status: 400 });
  }
  const d = parsed.data;
  const suggestedRetail = computeRetail(d.wholesalePrice, d.markupPct, d.fixedMarkup);

  const entry = await db.supplierCatalogueEntry.create({
    data: {
      supplierId: d.supplierId,
      supplierRef: d.supplierRef || null,
      itemName: d.itemName,
      wholesalePrice: d.wholesalePrice,
      markupPct: d.markupPct,
      fixedMarkup: d.fixedMarkup,
      availability: d.availability,
      notes: d.notes || null,
      productId: d.productId || null,
    },
  });
  return NextResponse.json({ ok: true, id: entry.id, suggestedRetail });
}
