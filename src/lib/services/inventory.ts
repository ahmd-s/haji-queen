import type { Order, OrderItem, Prisma } from "@prisma/client";
import { ServiceError } from "@/lib/services/errors";

export type StockReason =
  | "PURCHASE"
  | "RESTOCK"
  | "ORDER_PLACED"
  | "ORDER_CANCELLED"
  | "MANUAL_ADJUSTMENT";

type ClaimArgs = {
  variantId: string;
  productId: string;
  quantity: number;
  trackStock: boolean;
  orderId: string;
  productName: string;
  size: string;
  color: string;
};

/**
 * Conditionally decrements a variant inside the order transaction. The
 * `stock >= quantity` predicate prevents two checkouts claiming the last unit.
 */
export async function claimVariantStock(
  tx: Prisma.TransactionClient,
  args: ClaimArgs
): Promise<void> {
  const claimed = await tx.productVariant.updateMany({
    where: { id: args.variantId, stock: { gte: args.quantity } },
    data: { stock: { decrement: args.quantity } },
  });
  if (claimed.count !== 1) {
    throw new ServiceError(
      "UNAVAILABLE",
      `${args.productName} (${args.color}, ${args.size}) just sold out. Please adjust your bag.`
    );
  }

  await tx.stockMovement.create({
    data: {
      productId: args.productId,
      variantId: args.variantId,
      orderId: args.orderId,
      delta: -args.quantity,
      reason: "ORDER_PLACED",
      note: `${args.color} / ${args.size}`,
    },
  });

  await tx.product.update({
    where: { id: args.productId },
    data: {
      stock: { decrement: args.quantity },
      popularity: { increment: args.quantity },
    },
  });
}

/** Popularity-only update for pre-order rows that have no quantities to claim. */
export async function recordPreorderInterest(
  tx: Prisma.TransactionClient,
  args: { productId: string; quantity: number }
): Promise<void> {
  await tx.product.update({
    where: { id: args.productId },
    data: { popularity: { increment: args.quantity } },
  });
}

/**
 * Restocks a cancelled order exactly once. `cancelledAt` is the guard, so an
 * owner re-saving an already-cancelled order cannot create stock twice.
 *
 * The StockMovement ledger is the source of truth for how many units were
 * actually claimed, so a later `trackStock` change cannot cause a missed or
 * duplicated restock. Legacy orders with no ledger fall back to the old flag.
 */
export async function restockCancelledOrder(
  tx: Prisma.TransactionClient,
  order: Order & { items: OrderItem[] },
  actorId?: string | null
): Promise<void> {
  for (const item of order.items) {
    if (!item.variantId || item.quantity <= 0) continue;
    const variant = await tx.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: { select: { id: true, trackStock: true } } },
    });
    if (!variant) continue;

    const placed = await tx.stockMovement.aggregate({
      where: {
        orderId: order.id,
        variantId: variant.id,
        reason: "ORDER_PLACED",
      },
      _sum: { delta: true },
    });
    const claimed = -(placed._sum.delta ?? 0);
    const restockQty = Math.min(claimed > 0 ? claimed : item.quantity, item.quantity);
    if (restockQty <= 0 || (claimed <= 0 && !variant.product.trackStock)) continue;

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stock: { increment: restockQty } },
    });
    await tx.product.update({
      where: { id: variant.product.id },
      data: { stock: { increment: restockQty } },
    });
    await tx.stockMovement.create({
      data: {
        productId: variant.product.id,
        variantId: variant.id,
        orderId: order.id,
        delta: restockQty,
        reason: "ORDER_CANCELLED",
        actorId: actorId ?? null,
        note: `Restock for ${order.orderNumber}`,
      },
    });
  }
}
