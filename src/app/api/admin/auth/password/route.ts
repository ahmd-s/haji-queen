import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";
import { rateLimit, rateLimitResponse } from "@/lib/security";

const schema = z.object({
  currentPassword: z.string().min(6).max(128),
  newPassword: z.string().min(12).max(128),
});

/** POST — change the current admin's password and revoke all existing sessions. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  if (!rateLimit(`password-change:${guard.admin.id}`, 5, 10 * 60 * 1000)) {
    return rateLimitResponse();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "New password must be at least 12 characters." },
      { status: 400 }
    );
  }

  const admin = await db.adminUser.findUnique({ where: { id: guard.admin.id } });
  if (!admin || !verifyPassword(parsed.data.currentPassword, admin.passwordHash)) {
    await writeAudit(req, {
      action: "ADMIN_PASSWORD_CHANGE_FAILED",
      entityType: "AdminUser",
      entityId: guard.admin.id,
      actor: guard.admin,
      metadata: { reason: "invalid_current_password" },
    });
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword),
      sessionVersion: { increment: 1 },
    },
  });

  await writeAudit(req, {
    action: "ADMIN_PASSWORD_CHANGED",
    entityType: "AdminUser",
    entityId: admin.id,
    actor: guard.admin,
  });

  const res = NextResponse.json({
    ok: true,
    message: "Password changed. Please sign in again.",
  });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
