import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/auth";

/**
 * Server-side admin guard for API routes.
 * Returns the session payload, or a 401 response to return directly.
 */
export function requireAdmin(
  req: NextRequest
): { session: SessionPayload; error?: undefined } | { session?: undefined; error: NextResponse } {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
