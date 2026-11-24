import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getCategories, getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop All: Abayas, Maxis, Indo-Western & Workwear",
  description:
    "Browse the complete Haji Queens collection: abayas, maxis and dresses, Indo-Western sets and workwear.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search: raw } = await searchParams;
  const search = raw?.trim() || undefined;
  const [categories, products] = await Promise.all([getCategories(), getProducts({ search, sort: "newest" })]);

  return (
    <>
      <header className="wrap pb-8 pt-10 md:pb-12 md:pt-16">
        {search && <p className="mb-2 text-ink-soft">Search results for</p>}
        <h1 className="t-title">{search ? `“${search}”` : "The collection"}</h1>
      </header>
      <Suspense>
        <ShopBrowser key={search ?? ""} products={products} categories={categories} active={search ? "" : "all"} />
      </Suspense>
    </>
  );
}
