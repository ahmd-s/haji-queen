import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-api";
import { listAdminInquiries } from "@/lib/services/admin-lists";

/** GET — sensitive measurement enquiries; admin only, bounded pagination. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const page = await listAdminInquiries(req.nextUrl.searchParams);
  return NextResponse.json({ inquiries: page.items, pagination: page.pagination });
}
