import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

/**
 * Admin authentication — HMAC-signed session tokens + scrypt password hashing.
 * The signing secret is required. There is deliberately no fallback secret:
 * a missing AUTH_SECRET must fail closed rather than allow forged tokens.
 */

export const SESSION_COOKIE = "hq_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type SessionPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  ver: number;
  exp: number; // unix seconds
};

export type SessionInput = Omit<SessionPayload, "exp">;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is required and must be at least 32 characters. Set it in the deployment environment."
    );
  }
  return secret;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function sign(data: string): string {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

export function createSessionToken(payload: SessionInput): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(full));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.ver !== "number" || !ADMIN_ROLES.includes(payload.role as AdminRole)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === "SUPER_ADMIN";
}
