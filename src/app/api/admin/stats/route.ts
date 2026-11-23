import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

/** GET — dashboard attention counts and recent activity. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const [
    totalProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    newInquiries,
    recentOrders,
    recentInquiries,
    revenueRows,
    paidRows,
    pendingPrices,
    enquiryOnly,
    lowStockRows,
  ] = await Promise.all([
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
    db.measurementInquiry.findMany({
      where: { status: { in: ["NEW", "IN_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        garmentType: true,
        status: true,
        createdAt: true,
      },
    }),
    db.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
    }),
    db.product.count({ where: { OR: [{ priceConfirmed: false }, { price: 0 }] } }),
    db.product.count({ where: { isEnquiryOnly: true } }),
    db.productVariant.findMany({
      where: { isActive: true },
      select: { stock: true, lowStockThreshold: true },
      take: 2000,
    }),
  ]);

  const lowStock = lowStockRows.filter((v) => v.stock <= v.lowStockThreshold).length;

  return NextResponse.json({
    stats: {
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      newInquiries,
      totalRevenue: revenueRows._sum.total ?? 0,
      paidRevenue: paidRows._sum.total ?? 0,
      lowStock,
      pendingPrices,
      enquiryOnly,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    })),
    recentInquiries: recentInquiries.map((i) => ({
      id: i.id,
      fullName: i.fullName,
      garmentType: i.garmentType,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}
