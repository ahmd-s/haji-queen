import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth-api";
import { hasValidOrigin, originErrorResponse, rateLimit, rateLimitResponse, requestIp } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
});

/** POST — login */
export async function POST(req: NextRequest) {
  if (!hasValidOrigin(req)) return originErrorResponse();
  if (!rateLimit(`login:${requestIp(req)}`, 8, 60_000)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    const admin = await db.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!admin || !admin.isActive || !verifyPassword(parsed.data.password, admin.passwordHash)) {
      await writeAudit(req, {
        action: "ADMIN_LOGIN_FAILED",
        entityType: "AdminUser",
        actor: { email: parsed.data.email.toLowerCase() },
        metadata: { reason: "invalid_credentials" },
      });
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = createSessionToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      ver: admin.sessionVersion,
    });

    await writeAudit(req, {
      action: "ADMIN_LOGIN",
      entityType: "AdminUser",
      entityId: admin.id,
      actor: { id: admin.id, email: admin.email, name: admin.name },
    });

    const res = NextResponse.json({ ok: true, name: admin.name, role: admin.role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Server authentication is not configured. Contact the site administrator." },
      { status: 500 }
    );
  }
}

/** DELETE — logout. Increments sessionVersion to revoke every issued token. */
export async function DELETE(req: NextRequest) {
  if (!hasValidOrigin(req)) return originErrorResponse();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (session) {
    await db.adminUser
      .update({
        where: { id: session.id },
        data: { sessionVersion: { increment: 1 } },
      })
      .catch(() => undefined);
    await writeAudit(req, {
      action: "ADMIN_LOGOUT",
      entityType: "AdminUser",
      entityId: session.id,
      actor: { id: session.id, email: session.email, name: session.name },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/** GET — current session info */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return NextResponse.json({ session: null }, { status: 200 });
  return NextResponse.json({
    session: {
      name: guard.admin.name,
      email: guard.admin.email,
      role: guard.admin.role,
    },
  });
}
