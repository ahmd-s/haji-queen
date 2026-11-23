import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth-api";
import { writeAudit } from "@/lib/audit";

/**
 * Admin image upload — accepts multiple files per request and stores the
 * ORIGINAL bytes untouched (per catalogue data rule 7: never recompress or
 * crop product photography) under /public/images/products/.
 *
 * Returns public URLs that can be attached to a product's images array.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "products");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function safeName(name: string): string {
  const base = name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 60);
  return base || "image";
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, { roles: ["SUPER_ADMIN"] });
  if (guard.error) return guard.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // yymmdd
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = ALLOWED[file.type];
    if (!ext) {
      errors.push(`${file.name}: unsupported type (${file.type || "unknown"}). Use JPG, PNG or WEBP.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: file is larger than 8 MB.`);
      continue;
    }
    const filename = `${stamp}-${randomBytes(4).toString("hex")}-${safeName(file.name.replace(/\.[^.]+$/, ""))}${ext}`;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, filename), buffer);
      urls.push(`/images/products/${filename}`);
    } catch {
      errors.push(`${file.name}: could not be saved.`);
    }
  }

  if (urls.length === 0) {
    return NextResponse.json({ error: errors.join(" ") || "Upload failed." }, { status: 400 });
  }
  await writeAudit(req, {
    action: "ADMIN_UPLOAD",
    entityType: "Upload",
    metadata: { fileCount: files.length, uploadedCount: urls.length },
    actor: guard.admin,
  });
  return NextResponse.json({ ok: true, urls, errors });
}
