import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getCategories, getProducts } from "@/lib/data";
import { newArrivals } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The newest abayas, skirt sets and coat sets from Haji Queens.",
};

export const dynamic = "force-dynamic";

export default async function NewArrivalsPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts({ sort: "newest" })]);

  return (
    <>
      <header className="wrap grid gap-x-12 gap-y-4 pb-8 pt-10 md:grid-cols-[1.2fr_1fr] md:items-end md:pb-12 md:pt-16">
        <h1 className="t-title">New arrivals</h1>
        <p className="t-body md:justify-self-end">The latest pieces to join the collection.</p>
      </header>
      <Suspense>
        <ShopBrowser products={newArrivals(products)} categories={categories} active="new" />
      </Suspense>
    </>
  );
}
