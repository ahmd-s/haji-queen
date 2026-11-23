import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (Next.js 16 replacement for middleware) — first line of defence for
 * /admin and /api/admin. API routes still re-verify the session, role and DB
 * state server-side; this only filters obviously unauthenticated requests.
 */

const SESSION_COOKIE = "hq_admin_session";

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  return String.fromCharCode(...new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i)));
}

async function verify(token: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return false;
  if (!token) return false;

  const [body, sig] = token.split(".");
  if (!body || !sig) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(base64UrlDecode(sig), (char) => char.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(body)
    );
    if (!valid) return false;

    const payload = JSON.parse(base64UrlDecode(body)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function hasValidOrigin(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthRoute = pathname.startsWith("/api/admin/auth");

  if (pathname.startsWith("/api/admin") && !isAuthRoute) {
    if (!hasValidOrigin(req)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const authed = await verify(req.cookies.get(SESSION_COOKIE)?.value);
    if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
