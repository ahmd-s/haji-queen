import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductCard } from "@/components/product/product-card";
import { merchandise } from "@/lib/storefront";
import { getProductBySlug, getProducts } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/** Unpublished products open only for a signed-in admin (preview). */
async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(verifySessionToken(token));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { allowHidden: await isAdmin() });
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    ...(product.preview ? { robots: { index: false, follow: false } } : {}),
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ colour?: string }>;
}) {
  const [{ slug }, { colour }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Same collection first, then the rest of the catalogue; real pieces lead.
  const others = merchandise((await getProducts()).filter((p) => p.id !== product.id && p.images.length > 0));
  const sameCategory = others.filter((p) => p.category.slug === product.category.slug);
  const related = [...new Set([...sameCategory.slice(0, 2), ...others, ...sameCategory])].slice(0, 4);

  // Structured product data (SEO readiness). Pending-price products are not
  // advertised with an offer; unconfirmed prices never reach search engines.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => `${SITE_URL}${i}`),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.category.name,
  };
  if (product.priceConfirmed && product.price > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    };
  }
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <ProductDetail key={product.id} product={product} initialColour={colour} />

      {related.length > 0 && (
        <section className="bg-shell" aria-labelledby="related-heading">
          <div className="wrap section">
            <h2 id="related-heading" className="t-head">
              You may also like
            </h2>
            <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
