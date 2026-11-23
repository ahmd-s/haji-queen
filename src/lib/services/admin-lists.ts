import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/types";

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

type PaginationOptions = {
  defaultPageSize: number;
  maxPageSize: number;
};

function positiveInt(raw: string | null, fallback: number, max: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.trunc(value), max);
}

export function parsePagination(
  sp: URLSearchParams,
  options: PaginationOptions
): { skip: number; take: number; page: number; pageSize: number } {
  const page = positiveInt(sp.get("page"), 1, 10000);
  const pageSize = positiveInt(sp.get("pageSize"), options.defaultPageSize, options.maxPageSize);
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

function paginationFor(total: number, page: number, pageSize: number): Pagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function parseReviewNotes(raw: string | null): { field: string; note: string }[] {
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is { field: string; note: string } =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { field?: unknown }).field === "string" &&
      typeof (item as { note?: unknown }).note === "string"
  );
}

/** Admin catalogue list: includes hidden rows and internal supplier context. */
export async function listAdminProducts(
  sp: URLSearchParams
): Promise<Paginated<unknown>> {
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 50,
    maxPageSize: 200,
  });
  const where: Prisma.ProductWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  const status = sp.get("status");
  if (status === "live") where.visible = true;
  if (status === "hidden") where.visible = false;
  if (status === "pending") where.priceConfirmed = false;
  const categoryId = sp.get("categoryId")?.trim();
  if (categoryId) where.categoryId = categoryId;
  const source = sp.get("source");
  if (source === "HQ_ORIGINAL" || source === "TRUSTED_SUPPLIER") where.source = source;

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        catalogueEntry: { include: { supplier: true } },
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            stock: true,
            extraPrice: true,
            isActive: true,
            lowStockThreshold: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.product.count({ where }),
  ]);

  return {
    items: rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      categoryName: p.category.name,
      categoryId: p.categoryId,
      source: p.source,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      colors: parseJson(p.colors, []),
      sizes: parseJson<string[]>(p.sizes, []),
      images: parseJson<string[]>(p.images, []),
      badge: p.badge,
      featured: p.featured,
      visible: p.visible,
      stock: p.stock,
      priceConfirmed: p.priceConfirmed,
      trackStock: p.trackStock,
      availability: p.availability,
      isEnquiryOnly: p.isEnquiryOnly,
      customSizingAllowed: p.customSizingAllowed,
      readyToDispatch: p.readyToDispatch,
      preorderAllowed: p.preorderAllowed,
      sizeNotes: p.sizeNotes,
      catalogueBatch: p.catalogueBatch,
      reviewNotes: parseReviewNotes(p.reviewNotes),
      description: p.description,
      fabricDetails: p.fabricDetails,
      careInstructions: p.careInstructions,
      variants: p.variants,
      supplierEntry: p.catalogueEntry
        ? {
            supplierName: p.catalogueEntry.supplier.name,
            // Internal-only fields — admin scope
            wholesalePrice: p.catalogueEntry.wholesalePrice,
            markupPct: p.catalogueEntry.markupPct,
          }
        : null,
    })),
    pagination: paginationFor(total, page, pageSize),
  };
}

/** Admin order list with bounded search/filter support. */
export async function listAdminOrders(
  sp: URLSearchParams
): Promise<Paginated<unknown>> {
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 200,
    maxPageSize: 200,
  });
  const where: Prisma.OrderWhereInput = {};
  const statuses = sp.getAll("status").filter(Boolean);
  if (statuses.length) where.status = { in: statuses };
  const paymentStatuses = sp.getAll("paymentStatus").filter(Boolean);
  if (paymentStatuses.length) where.paymentStatus = { in: paymentStatuses };
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.order.count({ where }),
  ]);
  return {
    items: rows,
    pagination: paginationFor(total, page, pageSize),
  };
}

/** Sensitive measurement data — admin only, with bounded pagination. */
export async function listAdminInquiries(
  sp: URLSearchParams
): Promise<Paginated<unknown>> {
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 200,
    maxPageSize: 200,
  });
  const where: Prisma.MeasurementInquiryWhereInput = {};
  const statuses = sp.getAll("status").filter(Boolean);
  if (statuses.length) where.status = { in: statuses };
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { garmentType: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.measurementInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.measurementInquiry.count({ where }),
  ]);
  return {
    items: rows,
    pagination: paginationFor(total, page, pageSize),
  };
}
