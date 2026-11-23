import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/auth";
import { hasValidOrigin, originErrorResponse } from "@/lib/security";

type AdminRecord = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  sessionVersion: number;
};

type RequireAdminOptions = {
  roles?: string[];
};

type RequireAdminResult =
  | { session: SessionPayload; admin: AdminRecord; error?: undefined }
  | { session?: undefined; admin?: undefined; error: NextResponse };

/**
 * Server-side admin guard for API routes.
 * Verifies the token, rechecks the DB record, enforces roles, and blocks
 * cross-origin state changes. Never rely on proxy protection alone.
 */
export async function requireAdmin(
  req: NextRequest,
  options: RequireAdminOptions = {}
): Promise<RequireAdminResult> {
  if (!hasValidOrigin(req)) return { error: originErrorResponse() };

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = await db.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!admin || !admin.isActive || admin.sessionVersion !== session.ver) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (options.roles && options.roles.length > 0 && !options.roles.includes(admin.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, admin };
}
