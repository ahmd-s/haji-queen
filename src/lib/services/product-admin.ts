import type { Prisma } from "@prisma/client";
import type { AdminProductWrite } from "@/lib/admin-product";
import { ServiceError } from "@/lib/services/errors";

type VariantInput = AdminProductWrite["variants"][number];

function variantKey(size: string, color: string): string {
  return `${size}\u0000${color}`;
}

function derivedVariants(d: AdminProductWrite, stockFallback: number): VariantInput[] {
  const colors = d.colors.length > 0 ? d.colors.map((c) => c.name) : [""];
  const per = colors.length * d.sizes.length;
  const each = per > 0 ? Math.floor(stockFallback / per) : 0;
  return d.sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock: each,
      extraPrice: 0,
      isActive: true,
      lowStockThreshold: 2,
    }))
  );
}

/**
 * Keeps variants aligned with the owner's size × colour grid. Rows that are
 * no longer wanted are deactivated when they have history or stock; empty
 * unused rows are removed. Existing sale records are never deleted.
 */
export async function syncProductVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  d: AdminProductWrite,
  stockFallback = 0,
  actorId?: string | null
): Promise<void> {
  const requested = d.variants.length > 0 ? d.variants : derivedVariants(d, stockFallback);
  const desired = new Map<string, VariantInput>();
  for (const row of requested) {
    desired.set(variantKey(row.size, row.color), row);
  }

  const current = await tx.productVariant.findMany({
    where: { productId },
    include: {
      _count: { select: { orderItems: true, stockMovements: true } },
    },
  });

  for (const row of current) {
    const key = variantKey(row.size, row.color);
    const wanted = desired.get(key);
    if (!wanted) {
      const referenced = row._count.orderItems > 0 || row._count.stockMovements > 0;
      if (!referenced && row.stock === 0) {
        await tx.productVariant.delete({ where: { id: row.id } });
      } else if (row.isActive) {
        await tx.productVariant.update({
          where: { id: row.id },
          data: { isActive: false },
        });
      }
      continue;
    }

    const delta = wanted.stock - row.stock;
    await tx.productVariant.update({
      where: { id: row.id },
      data: {
        size: wanted.size,
        color: wanted.color,
        stock: wanted.stock,
        extraPrice: wanted.extraPrice,
        isActive: wanted.isActive,
        lowStockThreshold: wanted.lowStockThreshold,
        ...(wanted.sku !== undefined ? { sku: wanted.sku || null } : {}),
      },
    });
    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          productId,
          variantId: row.id,
          delta,
          reason: delta > 0 ? "RESTOCK" : "MANUAL_ADJUSTMENT",
          actorId: actorId ?? null,
          note: "Stock updated in the product editor",
        },
      });
    }
    desired.delete(key);
  }

  for (const row of desired.values()) {
    const variant = await tx.productVariant.create({
      data: {
        productId,
        size: row.size,
        color: row.color,
        stock: row.stock,
        extraPrice: row.extraPrice,
        isActive: row.isActive,
        lowStockThreshold: row.lowStockThreshold,
        ...(row.sku ? { sku: row.sku } : {}),
      },
    });
    if (row.stock !== 0) {
      await tx.stockMovement.create({
        data: {
          productId,
          variantId: variant.id,
          delta: row.stock,
          reason: "RESTOCK",
          actorId: actorId ?? null,
          note: "Initial stock entered in the product editor",
        },
      });
    }
  }

  await recalculateProductStock(tx, productId);
}

export async function recalculateProductStock(
  tx: Prisma.TransactionClient,
  productId: string
): Promise<number> {
  const result = await tx.productVariant.aggregate({
    where: { productId, isActive: true },
    _sum: { stock: true },
  });
  const stock = result._sum.stock ?? 0;
  await tx.product.update({ where: { id: productId }, data: { stock } });
  return stock;
}

export function variantConflictMessage(error: unknown, fallback: string): string {
  if (
    error instanceof Error &&
    (error.message.includes("Unique") || error.message.includes("P2002"))
  ) {
    return "Two variants use the same size and colour. Check the option grid and try again.";
  }
  if (error instanceof ServiceError) return error.message;
  return fallback;
}
