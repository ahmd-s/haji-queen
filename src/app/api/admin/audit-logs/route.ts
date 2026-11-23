import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { parsePagination } from "@/lib/services/admin-lists";
import { parseJson } from "@/lib/types";
import type { AuditLogRow, Pagination } from "@/lib/admin-types";

/** GET — audit trail with filters; write-only in the application. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const sp = req.nextUrl.searchParams;
  const { skip, take, page, pageSize } = parsePagination(sp, {
    defaultPageSize: 50,
    maxPageSize: 200,
  });
  const where: Prisma.AuditLogWhereInput = {};
  const search = sp.get("search")?.trim();
  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
    ];
  }
  const action = sp.get("action")?.trim();
  if (action) where.action = action;
  const entityType = sp.get("entityType")?.trim();
  if (entityType) where.entityType = entityType;

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.auditLog.count({ where }),
  ]);
  const items: AuditLogRow[] = rows.map((r) => ({
    id: r.id,
    actorId: r.actorId,
    actorEmail: r.actorEmail,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: parseJson<Record<string, unknown> | null>(r.metadata, null),
    ip: r.ip,
    createdAt: r.createdAt.toISOString(),
  }));
  const pagination: Pagination = {
    page,
    pageSize: take,
    total,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
  return NextResponse.json({ items, logs: items, pagination });
}
