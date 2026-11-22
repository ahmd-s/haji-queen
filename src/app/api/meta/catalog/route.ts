import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/**
 * Meta catalogue feed (CSV) — Phase 9 readiness.
 * Simple, schedule-friendly CSV of visible products for a future
 * Facebook/Instagram shop integration. Retail prices only.
 */
export async function GET() {
  const products = await db.product.findMany({
    where: { visible: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = [
    "id,title,description,availability,condition,price,link,image_link,brand,product_type",
  ];

  for (const p of products) {
    const images = JSON.parse(p.images || "[]") as string[];
    rows.push(
      [
        p.id,
        esc(p.name),
        esc(p.description.slice(0, 5000)),
        p.stock > 0 ? "in stock" : "out of stock",
        "new",
        `${p.price.toFixed(2)} INR`,
        `${SITE_URL}/product/${p.slug}`,
        images[0] ? `${SITE_URL}${images[0]}` : "",
        "Haji Queens",
        esc(p.category.name),
      ].join(",")
    );
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
