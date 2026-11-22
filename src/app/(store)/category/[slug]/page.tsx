import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/product/shop-browser";
import { getCategories, getCategoryBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Collection" };
  return {
    title: `${category.name} — ${category.tagline ?? "Collection"}`,
    description: category.description ?? undefined,
    openGraph: {
      title: `${category.name} | Haji Queens`,
      description: category.description ?? undefined,
      images: category.bannerImage ? [{ url: category.bannerImage }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();

  return (
    <>
      <header className="relative">
        <div className="relative min-h-[46vh] w-full overflow-hidden bg-espresso lg:min-h-[58vh]">
          {category.bannerImage && (
            <Image
              src={category.bannerImage}
              alt={`${category.name} collection`}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/15 to-transparent" />
          <div className="container-hq absolute inset-x-0 bottom-0 pb-10 lg:pb-14">
            <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-champagne/85">
              <Link href="/" className="hover:text-ivory">
                Home
              </Link>
              <span className="mx-1.5 text-gold">/</span>
              <Link href="/shop" className="hover:text-ivory">
                Shop
              </Link>
              <span className="mx-1.5 text-gold">/</span>
              <span className="text-ivory">{category.name}</span>
            </nav>
            <h1 className="display-1 mt-3 text-ivory">{category.name}</h1>
            {category.tagline && (
              <p className="mt-2 font-display text-xl italic text-champagne/90">{category.tagline}</p>
            )}
          </div>
        </div>
        {category.description && (
          <div className="border-b border-border bg-ivory">
            <p className="container-hq py-8 max-w-2xl text-[14.5px] leading-relaxed text-espresso/75">
              {category.description}
            </p>
          </div>
        )}
      </header>

      <div className="pt-10">
        <Suspense
          fallback={<div className="container-hq py-20 text-center text-sm text-taupe">Loading pieces…</div>}
        >
          <ShopBrowser categories={categories} lockedCategory={category.slug} />
        </Suspense>
      </div>
    </>
  );
}
