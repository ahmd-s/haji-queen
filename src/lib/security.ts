import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Small in-process rate limiter. On serverless this is per-instance, but it
 * still stops basic brute-force and accidental double-submit traffic.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function requestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}

/** Same-origin check for state-changing browser requests. */
export function hasValidOrigin(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  const origin = req.headers.get("origin");
  // Browser requests include Origin; non-browser API clients may not.
  // SameSite cookies and server-side auth still protect cookie-based routes.
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * Public API check: block browsers from a different origin, but allow
 * non-browser clients that do not send an Origin header.
 */
export function hasAllowedPublicOrigin(req: NextRequest): boolean {
  return hasValidOrigin(req);
}

export function originErrorResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
}
