import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/data";
import { categoryPhoto } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection" };
  const photo = categoryPhoto(category);
  return {
    title: category.name,
    description: category.description ?? undefined,
    openGraph: {
      title: `${category.name} | Haji Queens`,
      description: category.description ?? undefined,
      images: photo ? [{ url: photo }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getProducts({ category: slug, sort: "newest" }),
  ]);
  if (!category) notFound();

  return (
    <>
      <header className="wrap grid gap-x-12 gap-y-4 pb-8 pt-10 md:grid-cols-[1.2fr_1fr] md:items-end md:pb-12 md:pt-16">
        <h1 className="t-title">{category.name}</h1>
        {category.description && <p className="t-body md:justify-self-end">{category.description}</p>}
      </header>
      <Suspense>
        <ShopBrowser key={slug} products={products} categories={categories} active={slug} editorial />
      </Suspense>
    </>
  );
}
