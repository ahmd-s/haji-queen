import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { getCatalogueFeedRows } from "@/lib/services/catalogue";

/**
 * Meta catalogue feed (CSV) — confirmed, visible retail products only.
 * The service layer enforces the same public-price rules as the storefront.
 */
export async function GET() {
  const products = await getCatalogueFeedRows();
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = [
    "id,title,description,availability,condition,price,link,image_link,brand,product_type",
  ];

  for (const p of products) {
    rows.push(
      [
        p.id,
        esc(p.name),
        esc(p.description.slice(0, 5000)),
        p.stock > 0 ? "in stock" : "out of stock",
        "new",
        `${p.price.toFixed(2)} INR`,
        `${SITE_URL}/product/${p.slug}`,
        p.images[0] ? `${SITE_URL}${p.images[0]}` : "",
        "Haji Queens",
        esc(p.categoryName),
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
