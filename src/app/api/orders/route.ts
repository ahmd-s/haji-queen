import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingFor } from "@/lib/site";
import {
  isVariantPurchasable,
  unavailableReason,
  variantUnavailableReason,
} from "@/lib/availability";

/**
 * Order creation. Validates server-side, re-prices every line from the
 * database (client prices are never trusted), decrements stock atomically.
 * Payment: COD / BANK_TRANSFER create a PENDING, UNPAID order. RAZORPAY is
 * only accepted when a real key is configured; no simulated payment success.
 */
const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[+0-9][0-9\s-]{7,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email(),
  addressLine1: z.string().trim().min(5).max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "RAZORPAY"]),
  customerNote: z.string().trim().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.string().min(1),
        color: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(20),
});

function generateOrderNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `HQ-${rand}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.paymentMethod === "RAZORPAY" && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    return NextResponse.json(
      { error: "Online payment is not active yet. Please choose Cash on Delivery or Bank Transfer." },
      { status: 400 }
    );
  }

  try {
    const order = await db.$transaction(async (tx) => {
      const lines: {
        productId: string;
        productName: string;
        productSlug: string;
        imageUrl: string | null;
        size: string;
        color: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product || !product.visible) {
          throw new Error(`A product in your bag is no longer available.`);
        }

        const sizes = JSON.parse(product.sizes || "[]") as string[];
        const colours = JSON.parse(product.colors || "[]") as { name: string }[];
        // Older cart entries used "As shown" where a product has no colours.
        const requestedColor =
          item.color === "As shown" && colours.length === 0 ? "" : item.color;
        const sellable = { ...product, sizes };
        const productReason = unavailableReason(sellable);
        if (productReason) {
          throw new Error(`${product.name}: ${productReason}. Please enquire instead.`);
        }
        if (!isVariantPurchasable(sellable, item.size, requestedColor)) {
          throw new Error(
            variantUnavailableReason(sellable, item.size, requestedColor) ??
              `Please choose an available size and colour for ${product.name}.`
          );
        }
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === requestedColor
        )!;
        const images = JSON.parse(product.images || "[]") as string[];
        lines.push({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: images[0] ?? null,
          size: item.size,
          color: requestedColor,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal: product.price * item.quantity,
        });
        if (product.trackStock) {
          // Conditional update prevents two checkouts claiming the last unit.
          const claimed = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (claimed.count !== 1) {
            throw new Error(`${product.name} (${requestedColor || "as shown"}, ${item.size}) just sold out. Please adjust your bag.`);
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity }, popularity: { increment: item.quantity } },
          });
        } else {
          // Pre-order / enquiry catalogue rows have no quantities to decrement.
          await tx.product.update({
            where: { id: product.id },
            data: { popularity: { increment: item.quantity } },
          });
        }
      }

      const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
      const shippingFee = shippingFor(subtotal);
      const total = subtotal + shippingFee;

      let customerId: string | undefined;
      const existing = await tx.customer.findFirst({
        where: { phone: data.phone },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await tx.customer.create({
          data: { name: data.customerName, phone: data.phone, email: data.email },
        });
        customerId = created.id;
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId,
          customerName: data.customerName,
          phone: data.phone,
          email: data.email,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          subtotal,
          shippingFee,
          total,
          status: "PENDING",
          paymentMethod: data.paymentMethod,
          paymentStatus: "UNPAID",
          customerNote: data.customerNote || null,
          items: { create: lines },
        },
      });
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not place your order. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
