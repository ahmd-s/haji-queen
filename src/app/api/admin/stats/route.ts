import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

/** GET — dashboard statistics */
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  const [totalProducts, totalOrders, pendingOrders, completedOrders, newInquiries, recentOrders] =
    await Promise.all([
      db.product.count(),
      db.order.count(),
      db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.measurementInquiry.count({ where: { status: "NEW" } }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: true },
      }),
    ]);

  const revenueRows = await db.order.aggregate({
    _sum: { total: true },
    where: { status: { not: "CANCELLED" } },
  });

  return NextResponse.json({
    stats: {
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      newInquiries,
      totalRevenue: revenueRows._sum.total ?? 0,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    })),
  });
}
