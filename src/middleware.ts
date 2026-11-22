import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — first line of defence for /admin.
 * Verifies the HMAC session cookie; API routes re-verify server-side
 * (never rely on route protection alone).
 */
const SESSION_COOKIE = "hq_admin_session";

async function verify(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const secret = process.env.AUTH_SECRET || "hq-dev-secret-change-me-3f9c2b7a8d";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (expected !== sig) return false;
  try {
    const json = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" && json.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API guard: every /api/admin route requires a valid session,
  // except the auth endpoint itself (login/logout).
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth")) {
    const authed = await verify(req.cookies.get(SESSION_COOKIE)?.value);
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const authed = await verify(req.cookies.get(SESSION_COOKIE)?.value);
    if (isLoginPage) {
      if (authed) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }
    if (!authed) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
