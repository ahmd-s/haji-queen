import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-api";
import { listAdminOrders } from "@/lib/services/admin-lists";

/** GET — orders with bounded pagination, search and status filters. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const page = await listAdminOrders(req.nextUrl.searchParams);
  return NextResponse.json({ orders: page.items, pagination: page.pagination });
}
