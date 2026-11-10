import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

/** GET — measurement inquiries (sensitive data — admin only) */
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  const inquiries = await db.measurementInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ inquiries });
}
