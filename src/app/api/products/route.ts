import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/services/catalogue";

function numericParam(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Public catalogue API.
 * SECURITY: returns retail data only — never wholesale prices, supplier
 * records or margins. Supplier-sourced products are presented under the
 * same Haji Queens brand as originals.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limitParam = sp.get("limit");
  const products = await getProducts({
    category: sp.get("category") || undefined,
    search: sp.get("search") || undefined,
    colors: sp.getAll("color").filter(Boolean),
    sizes: sp.getAll("size").filter(Boolean),
    minPrice: numericParam(sp.get("minPrice")),
    maxPrice: numericParam(sp.get("maxPrice")),
    inStock: sp.get("inStock") === "true",
    sort: (sp.get("sort") as "newest" | "price-asc" | "price-desc" | "popular") || undefined,
    featuredOnly: sp.get("featured") === "true",
    limit: limitParam ? Math.min(Math.max(1, Math.trunc(numericParam(limitParam) ?? 12)), 60) : undefined,
  });
  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
