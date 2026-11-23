import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  actor?: { id?: string | null; email?: string | null; name?: string | null };
};

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? null;
}

export async function writeAudit(req: NextRequest, input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? input.actor?.name ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    // Audit must never break the underlying operation; log for operators instead.
    console.error("Audit write failed", error);
  }
}
