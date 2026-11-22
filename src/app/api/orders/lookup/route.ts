import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/** Order tracking lookup — requires both order number and matching contact. */
const schema = z.object({
  orderNumber: z.string().trim().min(4).max(20),
  contact: z.string().trim().min(5).max(120), // email OR phone
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your order number and email or phone." }, { status: 400 });
  }
  const { orderNumber, contact } = parsed.data;
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: { items: true },
  });
  if (
    !order ||
    (order.email.toLowerCase() !== contact.toLowerCase() &&
      order.phone.replace(/\D/g, "") !== contact.replace(/\D/g, ""))
  ) {
    return NextResponse.json(
      { error: "No matching order found. Check your details and try again." },
      { status: 404 }
    );
  }
  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, size: i.size, color: i.color })),
      estimatedNote:
        order.status === "PENDING"
          ? "We have received your order and will confirm it shortly."
          : order.status === "SHIPPED"
            ? "Your order is on its way."
            : order.status === "DELIVERED"
              ? "This order has been delivered. Thank you!"
              : "Your order is being prepared.",
    },
  });
}
