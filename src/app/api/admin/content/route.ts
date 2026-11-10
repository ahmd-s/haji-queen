import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";

/** GET — all editable site content */
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;
  const rows = await db.siteContent.findMany({ orderBy: { key: "asc" } });
  const content: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      content[r.key] = JSON.parse(r.value);
    } catch {
      content[r.key] = r.value;
    }
  }
  return NextResponse.json({ content });
}

const putSchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.unknown(), // JSON value; stringified below
});

/** PUT — upsert a content key */
export async function PUT(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  await db.siteContent.upsert({
    where: { key: parsed.data.key },
    update: { value: JSON.stringify(parsed.data.value) },
    create: { key: parsed.data.key, value: JSON.stringify(parsed.data.value) },
  });
  return NextResponse.json({ ok: true });
}
