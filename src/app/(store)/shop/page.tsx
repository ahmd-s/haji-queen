import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop All — Abayas, Maxis, Fusion & Workwear",
  description:
    "Browse the complete Haji Queens collection — modest abayas, flowing maxis, indo-western fusion and considered workwear.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const categories = await getCategories();

  return (
    <>
      <header className="border-b border-border bg-cream/40">
        <div className="container-hq py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-taupe">
            Home <span className="mx-1.5 text-gold">/</span> Shop
          </nav>
          <h1 className="display-1 mt-4 text-espresso">
            {search ? `“${search}”` : "The Collection"}
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-espresso/70">
            {search
              ? "Results from across our collections."
              : "Every piece in the Haji Queens edit — designed in-house or sourced from trusted catalogues, presented to one standard."}
          </p>
        </div>
      </header>

      <div className="pt-10">
        <Suspense
          fallback={<div className="container-hq py-20 text-center text-sm text-taupe">Loading collection…</div>}
        >
          <ShopBrowser categories={categories} initialSearch={search} />
        </Suspense>
      </div>
    </>
  );
}
