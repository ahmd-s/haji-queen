import { NextRequest, NextResponse } from "next/server";
import type { Category, Prisma, Product, ProductVariant } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { parsePagination } from "@/lib/services/admin-lists";
import type { InventoryRow, Pagination } from "@/lib/admin-types";

/** GET — variant-level inventory with search, active/low-stock filters and paging. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const sp = req.nextUrl.searchParams;
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 50,
    maxPageSize: 200,
  });
  const where: Prisma.ProductVariantWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { size: { contains: search, mode: "insensitive" } },
      { color: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { product: { sku: { contains: search, mode: "insensitive" } } },
    ];
  }
  const activeOnly = sp.get("active") !== "0";
  if (activeOnly) where.isActive = true;

  const lowStockOnly = sp.get("lowStock") === "1";
  const include = { product: { include: { category: true } } } as const;

  type VariantWithProduct = ProductVariant & { product: Product & { category: Category } };
  const toRow = (v: VariantWithProduct): InventoryRow => ({
    variantId: v.id,
    variantSku: v.sku,
    productId: v.productId,
    productName: v.product.name,
    productSlug: v.product.slug,
    productSku: v.product.sku,
    categoryName: v.product.category.name,
    size: v.size,
    color: v.color,
    stock: v.stock,
    extraPrice: v.extraPrice,
    isActive: v.isActive,
    lowStockThreshold: v.lowStockThreshold,
    trackStock: v.product.trackStock,
    available:
      v.isActive &&
      (v.product.trackStock
        ? v.stock > 0
        : v.product.availability !== "UNAVAILABLE" && v.product.visible),
  });

  let items: InventoryRow[];
  let total: number;

  if (lowStockOnly) {
    // Low-stock thresholds are per variant, so compare in the application
    // layer against a bounded result set rather than inventing a global value.
    const rows = await db.productVariant.findMany({
      where,
      include,
      orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
      take: 2000,
    });
    const filtered = rows
      .map(toRow)
      .filter((row) => row.isActive && row.stock <= row.lowStockThreshold);
    total = filtered.length;
    items = filtered.slice(skip, skip + take);
  } else {
    const [rows, count] = await Promise.all([
      db.productVariant.findMany({
        where,
        include,
        orderBy: [{ product: { name: "asc" } }, { size: "asc" }, { color: "asc" }],
        skip,
        take,
      }),
      db.productVariant.count({ where }),
    ]);
    items = rows.map(toRow);
    total = count;
  }

  const pagination: Pagination = {
    page,
    pageSize: take,
    total,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
  return NextResponse.json({ items, inventory: items, pagination });
}
