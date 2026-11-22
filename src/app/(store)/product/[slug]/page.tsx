import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/motion/reveal";
import { getContent, getProductBySlug, getRelatedProducts } from "@/lib/data";
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, contact] = await Promise.all([
    getRelatedProducts(product, 4),
    getContent<{ email?: string }>("contact", {}),
  ]);

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
      <ProductDetail product={product} enquiryEmail={contact.email} />

      {related.length > 0 && (
        <section className="border-t border-border bg-cream/40 py-16 lg:py-20" aria-labelledby="related-heading">
          <div className="container-hq">
            <Reveal className="mb-10 text-center">
              <p className="kicker kicker-center justify-center">Complete The Look</p>
              <h2 id="related-heading" className="display-3 mt-3 text-espresso">
                You may also love
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
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
