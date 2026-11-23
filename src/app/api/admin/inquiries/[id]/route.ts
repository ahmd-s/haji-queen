import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { INQUIRY_NEXT_STATUSES } from "@/lib/admin-labels";
import { ServiceError, serviceErrorResponse } from "@/lib/services/errors";

/** GET — full enquiry detail for the owner inbox. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const inquiry = await db.measurementInquiry.findUnique({ where: { id } });
  if (!inquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ inquiry });
}

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "SCHEDULED", "COMPLETED", "ARCHIVED"]).optional(),
  internalNotes: z.string().trim().max(1000).nullable().optional(),
});

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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid values." }, { status: 400 });
  }
  try {
    const existing = await db.measurementInquiry.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) throw new ServiceError("NOT_FOUND", "Enquiry not found.");
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = INQUIRY_NEXT_STATUSES[existing.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        throw new ServiceError(
          "VALIDATION",
          `Cannot move an enquiry from ${existing.status.toLowerCase()} to ${parsed.data.status.toLowerCase()}. Use the next action shown in the inbox.`
        );
      }
    }

    const inquiry = await db.measurementInquiry.update({ where: { id }, data: parsed.data });
    await writeAudit(req, {
      action: "INQUIRY_STATUS_UPDATE",
      entityType: "MeasurementInquiry",
      entityId: id,
      metadata: {
        status: inquiry.status,
        ...(parsed.data.internalNotes !== undefined ? { internalNotesUpdated: true } : {}),
      },
      actor: guard.admin,
    });
    return NextResponse.json({ ok: true, status: inquiry.status });
  } catch (error) {
    return serviceErrorResponse(error, "Could not update the enquiry.");
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  await db.measurementInquiry.delete({ where: { id } });
  await writeAudit(req, {
    action: "INQUIRY_DELETE",
    entityType: "MeasurementInquiry",
    entityId: id,
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true });
}
