import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/types";
import {
  isVariantPurchasable,
  unavailableReason,
  variantUnavailableReason,
} from "@/lib/availability";
import { ORDER_NEXT_STATUSES } from "@/lib/admin-labels";
import { ServiceError, isPrismaUniqueError } from "@/lib/services/errors";
import {
  checkIdempotency,
  stableHash,
  storeIdempotency,
  type IdempotencyParams,
} from "@/lib/services/idempotency";
import { claimVariantStock, recordPreorderInterest, restockCancelledOrder } from "@/lib/services/inventory";
import { buildOrderQuote, type PricedProduct, type QuoteInputLine } from "@/lib/services/pricing";

export const orderSchema = z.object({
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

export type CreateOrderInput = z.infer<typeof orderSchema>;

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
};

type OrderCreateData = Omit<Prisma.OrderUncheckedCreateInput, "id" | "orderNumber" | "idempotencyKey">;

const IDEMPOTENCY_SCOPE = "ORDER_CREATE";
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Duplicate cart lines are merged so stock is claimed once per variant. */
function mergeItems(items: QuoteInputLine[]): QuoteInputLine[] {
  const merged = new Map<string, QuoteInputLine>();
  for (const item of items) {
    const key = `${item.productId}\u0000${item.size}\u0000${item.color}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      if (existing.quantity > 10) {
        throw new ServiceError(
          "VALIDATION",
          "Maximum quantity for one size and colour is 10. Please adjust your bag."
        );
      }
    } else {
      merged.set(key, { ...item });
    }
  }
  return [...merged.values()].sort((a, b) =>
    `${a.productId}|${a.size}|${a.color}`.localeCompare(`${b.productId}|${b.size}|${b.color}`)
  );
}

/** Pre-check avoids catching a Postgres unique error inside an open transaction. */
async function allocateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `HQ-${randomInt(100000, 1000000)}`;
    const existing = await tx.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new ServiceError("CONFLICT", "Could not allocate an order number. Please try again.");
}

/**
 * Creates an order from server-side truth only: product price, active variant
 * price adjustment, availability and stock are all re-read in one transaction.
 */
export async function createOrder(
  input: CreateOrderInput,
  meta: { idempotencyKey?: string | null } = {}
): Promise<CreateOrderResult> {
  if (input.paymentMethod === "RAZORPAY" && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    throw new ServiceError(
      "PAYMENT_UNAVAILABLE",
      "Online payment is not active yet. Please choose Cash on Delivery or Bank Transfer."
    );
  }

  const items = mergeItems(input.items);
  const suppliedKey = meta.idempotencyKey?.trim() ?? "";
  if (
    suppliedKey &&
    (suppliedKey.length < 8 || suppliedKey.length > 200 || !/^[A-Za-z0-9_-]+$/.test(suppliedKey))
  ) {
    throw new ServiceError(
      "VALIDATION",
      "Idempotency-Key must be 8–200 letters, numbers, hyphens or underscores."
    );
  }

  // Only an explicit key opts into deduplication. The storefront sends none,
  // so a customer can legitimately place the same order twice.
  const params: IdempotencyParams | null = suppliedKey
    ? {
        key: `${IDEMPOTENCY_SCOPE}:${suppliedKey}`,
        scope: IDEMPOTENCY_SCOPE,
        requestHash: stableHash({ ...input, items }),
        ttlMs: IDEMPOTENCY_TTL_MS,
      }
    : null;

  if (params) {
    const precheck = await db.$transaction((tx) =>
      checkIdempotency<CreateOrderResult>(tx, params)
    );
    if (precheck.kind === "replay") return precheck.response;
    if (precheck.kind === "conflict") {
      throw new ServiceError(
        "CONFLICT",
        "This request was already submitted with different details. Please refresh and try again."
      );
    }
  }

  try {
    return await db.$transaction(async (tx) => {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const productRows = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true, shippingRule: true },
      });
      const productsById = new Map<string, PricedProduct>(
        productRows.map((product): [string, PricedProduct] => [product.id, product])
      );

      for (const item of items) {
        const product = productsById.get(item.productId);
        if (!product || !product.visible) {
          throw new ServiceError("UNAVAILABLE", "A product in your bag is no longer available.");
        }
        if (product.isEnquiryOnly) {
          throw new ServiceError(
            "UNAVAILABLE",
            `${product.name} is enquiry only. Please send a measurement request instead.`
          );
        }
        const sizes = parseJson<string[]>(product.sizes, []);
        const activeVariants = product.variants.filter((variant) => variant.isActive);
        const sellable = { ...product, sizes, variants: activeVariants };
        const productReason = unavailableReason(sellable);
        if (productReason) {
          throw new ServiceError(
            "UNAVAILABLE",
            `${product.name}: ${productReason}. Please enquire instead.`
          );
        }
        if (!isVariantPurchasable(sellable, item.size, item.color)) {
          throw new ServiceError(
            "UNAVAILABLE",
            variantUnavailableReason(sellable, item.size, item.color) ??
              `Please choose an available size and colour for ${product.name}.`
          );
        }
      }

      const quote = buildOrderQuote(productsById, items);
      const phoneKey = digitsOnly(input.phone);
      const emailNormalized = input.email.trim().toLowerCase();

      let customer = await tx.customer.findFirst({
        where: { OR: [{ phoneKey }, { phone: input.phone }] },
      });
      if (!customer) {
        try {
          customer = await tx.customer.create({
            data: {
              name: input.customerName,
              phone: input.phone,
              phoneKey,
              email: input.email,
              emailNormalized,
            },
          });
        } catch (error) {
          if (isPrismaUniqueError(error, "phoneKey")) {
            throw new ServiceError(
              "CONFLICT",
              "Another account uses this phone number. Please contact us."
            );
          }
          throw error;
        }
      } else if (!customer.phoneKey) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { phoneKey, emailNormalized },
        });
      }

      const orderData: OrderCreateData = {
        customerId: customer.id,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        subtotal: quote.subtotal,
        shippingFee: quote.shippingFee,
        total: quote.total,
        status: "PENDING",
        paymentMethod: input.paymentMethod,
        paymentStatus: "UNPAID",
        customerNote: input.customerNote || null,
        currency: quote.currency,
        shippingRuleId: quote.shippingRuleId,
        items: {
          create: quote.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productName: line.productName,
            productSlug: line.productSlug,
            imageUrl: line.imageUrl,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
      };

      const orderNumber = await allocateOrderNumber(tx);
      const order = await tx.order.create({
        data: { ...orderData, orderNumber },
      });

      for (const line of quote.lines) {
        if (line.trackStock) {
          await claimVariantStock(tx, {
            variantId: line.variantId,
            productId: line.productId,
            quantity: line.quantity,
            trackStock: true,
            orderId: order.id,
            productName: line.productName,
            size: line.size,
            color: line.color,
          });
        } else {
          await recordPreorderInterest(tx, {
            productId: line.productId,
            quantity: line.quantity,
          });
        }
      }

      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          toStatus: "PENDING",
          note: "Order placed",
        },
      });

      const result: CreateOrderResult = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
      };
      if (params) await storeIdempotency(tx, params, result);
      return result;
    });
  } catch (error) {
    if (isPrismaUniqueError(error, "orderNumber")) {
      throw new ServiceError("CONFLICT", "Could not allocate an order number. Please try again.");
    }
    // A concurrent retry may have won the idempotency key race.
    if (params && isPrismaUniqueError(error)) {
      const replay = await db.$transaction((tx) =>
        checkIdempotency<CreateOrderResult>(tx, params)
      );
      if (replay.kind === "replay") return replay.response;
      if (replay.kind === "conflict") {
        throw new ServiceError(
          "CONFLICT",
          "This request was already submitted with different details. Please refresh and try again."
        );
      }
    }
    throw error;
  }
}

export const orderLookupSchema = z.object({
  orderNumber: z.string().trim().min(4).max(20),
  contact: z.string().trim().min(5).max(120), // email OR phone
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

/** Limited tracking DTO — deliberately excludes address and customer PII. */
export async function lookupOrder(input: OrderLookupInput) {
  const order = await db.order.findUnique({
    where: { orderNumber: input.orderNumber.toUpperCase() },
    include: { items: true },
  });
  if (
    !order ||
    (order.email.toLowerCase() !== input.contact.toLowerCase() &&
      order.phone.replace(/\D/g, "") !== input.contact.replace(/\D/g, ""))
  ) {
    throw new ServiceError(
      "NOT_FOUND",
      "No matching order found. Check your details and try again."
    );
  }

  return {
    orderId: order.id,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      estimatedNote:
        order.status === "PENDING"
          ? "We have received your order and will confirm it shortly."
          : order.status === "SHIPPED"
            ? "Your order is on its way."
            : order.status === "DELIVERED"
              ? "This order has been delivered. Thank you!"
              : "Your order is being prepared.",
    },
  };
}

export const orderPatchSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]).optional(),
  internalNotes: z.string().trim().max(600).nullable().optional(),
  carrier: z.string().trim().max(80).nullable().optional(),
  trackingNumber: z.string().trim().max(120).nullable().optional(),
});

export type OrderPatchInput = z.infer<typeof orderPatchSchema>;

/** Status/payment updates with a one-time restock side effect on cancellation. */
export async function updateOrderStatus(
  id: string,
  patch: OrderPatchInput,
  actorId?: string | null
): Promise<{ status: string; paymentStatus: string }> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new ServiceError("NOT_FOUND", "Order not found.");

    if (patch.status && patch.status !== order.status) {
      const allowed = ORDER_NEXT_STATUSES[order.status] ?? [];
      if (!allowed.includes(patch.status)) {
        throw new ServiceError(
          "VALIDATION",
          `Cannot move an order from ${order.status.replace(/_/g, " ").toLowerCase()} to ${patch.status.replace(/_/g, " ").toLowerCase()}. Use the next step shown in the admin panel.`
        );
      }
    }

    const shouldRestock = patch.status === "CANCELLED" && !order.cancelledAt;
    if (shouldRestock) await restockCancelledOrder(tx, order, actorId);

    const data: Prisma.OrderUpdateInput = { ...patch };
    if (shouldRestock) data.cancelledAt = new Date();

    const updated = await tx.order.update({ where: { id }, data });

    if (patch.status && patch.status !== order.status) {
      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: patch.status,
          actorId: actorId ?? null,
          note: patch.internalNotes ?? null,
        },
      });
    }

    return { status: updated.status, paymentStatus: updated.paymentStatus };
  });
}
