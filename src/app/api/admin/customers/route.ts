import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { parsePagination } from "@/lib/services/admin-lists";
import type { AdminCustomerSummary, Pagination } from "@/lib/admin-types";

/** GET — deduped customer list with order history summary. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const sp = req.nextUrl.searchParams;
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 50,
    maxPageSize: 200,
  });
  const where: Prisma.CustomerWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { emailNormalized: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { phoneKey: { contains: search.replace(/\D/g, "") } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.customer.count({ where }),
  ]);

  const customers: AdminCustomerSummary[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    phoneKey: c.phoneKey,
    consentAt: c.consentAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    orderCount: c.orders.length,
    totalSpend: c.orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0),
    lastOrderAt: c.orders[0]?.createdAt.toISOString() ?? null,
    recentOrders: c.orders.slice(0, 3).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
  }));

  const pagination: Pagination = {
    page,
    pageSize: take,
    total,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
  return NextResponse.json({ customers, pagination });
}
