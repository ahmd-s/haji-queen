import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import type { AdminCustomerDetail, AdminOrder } from "@/lib/admin-types";

type RouteCtx = { params: Promise<{ id: string }> };

/** GET — one customer with complete order history. */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { items: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const orders: AdminOrder[] = customer.orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    addressLine1: o.addressLine1,
    addressLine2: o.addressLine2,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    paymentRef: o.paymentRef,
    customerNote: o.customerNote,
    internalNotes: o.internalNotes,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    cancellationReason: o.cancellationReason,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productSlug: i.productSlug,
      imageUrl: i.imageUrl,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
  }));

  const detail: AdminCustomerDetail = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    phoneKey: customer.phoneKey,
    consentAt: customer.consentAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
    orderCount: orders.length,
    totalSpend: orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0),
    lastOrderAt: orders[0]?.createdAt ?? null,
    recentOrders: orders.slice(0, 3).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    })),
    orders,
  };
  return NextResponse.json({ customer: detail });
}
