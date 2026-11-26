import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getContent, getProducts } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/site";
import {
  EDITORIAL,
  categoryLabel,
  categoryPhoto,
  hasPrice,
  newArrivals,
  ownImage,
  photoPosition,
  verifiedAwards,
  type Award,
} from "@/lib/storefront";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The campaign frames: three real pieces photographed in the same room. */
const CAMPAIGN = [
  { slug: "elegant-coat-set", colour: "Coffee", position: "50% 4%" },
  { slug: "luxury-organza-shrug-style-abaya", colour: "Ivory", position: "50% 12%" },
  { slug: "elegant-shrug-style-kaftan-abaya", colour: "Biscuit", position: "42% 40%" },
];
const STUDY_SLUG = "elegant-shrug-style-kaftan-abaya";

type Frame = { src: string; href: string; name: string; note: string; position?: string };

function frameFor(p: ProductDTO, colour?: string, position?: string): Frame | null {
  const c = p.colors.find((x) => x.name === colour) ?? p.colors[0];
  const src = c?.images?.[0] ?? p.images[0];
  if (!src) return null;
  return {
    src,
    href: `/product/${p.slug}${c ? `?colour=${encodeURIComponent(c.name)}` : ""}`,
    name: p.name,
    note: hasPrice(p) ? formatINR(p.price) : "Price on request",
    position: position ?? photoPosition(src),
  };
}

export default async function HomePage() {
  const [hero, story, measurements, awards, categories, products] = await Promise.all([
    getContent("hero", {
      headline: "Elegance, Woven Into Every Detail.",
      subtext:
        "Discover thoughtfully curated fashion that celebrates individuality, confidence and timeless elegance.",
      primaryCta: "Explore Collection",
      secondaryCta: "Discover Our Story",
      image: "",
    }),
    getContent<{ headline: string; body: string; image: string }>("story", {
      headline: "Seven Years of Style, Passion & Purpose.",
      body: "",
      image: "",
    }),
    getContent<{ headline: string; body: string }>("measurements", {
      headline: "Made To Fit You.",
      body: "Share your measurements and our team will personally assist you with sizing, alterations and made-to-measure guidance.",
    }),
    getContent<Award[]>("awards", []),
    getCategories(),
    getProducts({ sort: "newest" }),
  ]);

  const arrivals = newArrivals(products);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // An image chosen in the admin always leads the hero.
  const chosen = ownImage(hero.image);
  const frames: Frame[] = [
    ...(chosen ? [{ src: chosen, href: "/shop", name: "The collection", note: "" }] : []),
    ...CAMPAIGN.flatMap((f) => {
      const p = bySlug.get(f.slug);
      const frame = p && frameFor(p, f.colour, f.position);
      return frame ? [frame] : [];
    }),
    ...arrivals.filter((p) => !CAMPAIGN.some((f) => f.slug === p.slug)).flatMap((p) => frameFor(p) ?? []),
  ].slice(0, 3);

  const study =
    bySlug.get(STUDY_SLUG) ?? arrivals.find((p) => p.colors.filter((c) => c.images?.length).length >= 5);
  const studyColours = study?.colors.filter((c) => c.images?.length && c.available !== false) ?? [];
  const realAwards = verifiedAwards(awards);
  const storyImage = ownImage(story.image) ?? EDITORIAL.story;

  return (
    <>
      {/* Campaign */}
      <section aria-label="Campaign">
        <div className="intro-photos grid grid-cols-[1.9fr_1fr] grid-rows-2 gap-1 sm:grid-cols-[1.4fr_1.15fr_1fr] sm:grid-rows-1">
          {frames.map((f, i) => (
            <Link
              key={f.src}
              href={f.href}
              className={cn("group block", i === 0 && "row-span-2 sm:row-span-1")}
              aria-label={f.note ? `${f.name}, ${f.note}` : f.name}
            >
              <div
                className={cn(
                  "photo photo-hover sm:aspect-auto sm:h-[clamp(25rem,calc(100svh-20.5rem),52rem)]",
                  i === 0 ? "h-full min-h-[25rem]" : "aspect-[3/4] h-full w-full"
                )}
              >
                <Image
                  src={f.src}
                  alt=""
                  fill
                  quality={85}
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : undefined}
                  sizes={i === 0 ? "(max-width: 639px) 66vw, 40vw" : "(max-width: 639px) 34vw, 32vw"}
                  className="hero-in"
                  style={{ objectPosition: f.position }}
                />
              </div>
            </Link>
          ))}
        </div>
        <div className="wrap grid items-end gap-x-16 gap-y-5 pt-7 md:grid-cols-[1.35fr_1fr] md:pt-9">
          <h1 className="intro-enter-text t-hero max-w-[15ch]">{hero.headline.replace(/\.$/, "")}</h1>
          <div className="intro-enter-text md:pb-2" style={{ "--n": 1 } as React.CSSProperties}>
            <p className="max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-soft">{hero.subtext}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link href="/shop" className="btn btn-solid">
                {hero.primaryCta}
              </Link>
              <Link href="/our-story" className="link py-2">
                {hero.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="wrap section" aria-labelledby="collections-heading">
        <h2 id="collections-heading" className="t-head">
          Shop by collection
        </h2>
        <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-4">
          {categories.slice(0, 4).map((c, i) => {
            const photo = categoryPhoto(c);
            const n = products.filter((p) => p.category.slug === c.slug).length;
            return (
              <Link key={c.slug} href={`/category/${c.slug}`} className={cn("group block", i % 2 === 1 && "lg:mt-14")}>
                <div className="photo photo-hover aspect-[3/4]">
                  {photo && (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="(max-width: 1023px) 50vw, 25vw"
                      style={{ objectPosition: photoPosition(photo) }}
                    />
                  )}
                </div>
                <h3 className="t-sub mt-4 transition-colors group-hover:text-olive">{categoryLabel(c)}</h3>
                <p className="mt-0.5 text-[0.9375rem] text-ink-soft">
                  {n} {n === 1 ? "piece" : "pieces"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="wrap pb-[var(--section)]" aria-labelledby="new-heading">
          <div className="flex items-baseline justify-between gap-6">
            <h2 id="new-heading" className="t-head">
              New arrivals
            </h2>
            <Link href="/new-arrivals" className="link shrink-0 py-1">
              See all
            </Link>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14 lg:grid-cols-4">
            {arrivals.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Colour study */}
      {study && studyColours.length >= 4 && (
        <section aria-labelledby="study-heading" className="bg-shell">
          <div className="wrap grid items-end gap-x-16 gap-y-5 pb-9 pt-[var(--section)] md:grid-cols-[1.35fr_1fr]">
            <h2 id="study-heading" className="t-title max-w-[14ch]">
              One silhouette, {studyColours.length} colours
            </h2>
            <div>
              <p className="max-w-[46ch] text-ink-soft">{study.description}</p>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <Link href={`/product/${study.slug}`} className="link font-medium">
                  {study.name}
                </Link>
                {hasPrice(study) && <span className="price">{formatINR(study.price)}</span>}
              </p>
            </div>
          </div>
          <div className="study gap-1">
            {studyColours.map((c, i) => (
              <Link
                key={c.name}
                href={`/product/${study.slug}?colour=${encodeURIComponent(c.name)}`}
                className="study-panel block"
                data-lead={i === 0}
              >
                <Image
                  src={c.images![0]}
                  alt={`${study.name} in ${c.name}`}
                  fill
                  sizes="(max-width: 899px) 62vw, 36vw"
                />
                <span className="absolute bottom-3 left-3 bg-paper/90 px-3 py-1.5 text-[0.9375rem]">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Made to measure */}
      <section className="wrap section" aria-labelledby="fit-heading">
        <div className="grid gap-x-[clamp(2.5rem,7vw,7rem)] gap-y-9 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="photo rise aspect-[7/8]">
            <Image
              src={EDITORIAL.measure}
              alt="Ruffled white blouse with gathered sleeves over a blush pink skirt"
              fill
              sizes="(max-width: 767px) 100vw, 46vw"
            />
          </div>
          <div>
            <h2 id="fit-heading" className="t-title">
              {measurements.headline.replace(/\.$/, "")}
            </h2>
            <p className="t-body mt-5">{measurements.body}</p>
            <Link href="/custom-measurements" className="btn btn-solid mt-8">
              Send your measurements
            </Link>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-ink text-paper" aria-labelledby="story-heading">
        <div className="grid md:grid-cols-2">
          <div className="photo order-1 aspect-square !bg-ink md:order-2 md:aspect-auto md:min-h-[44rem]">
            <Image
              src={storyImage}
              alt="White ruffled blouse and bow-trimmed blush skirt, worn outdoors"
              fill
              quality={85}
              sizes="(max-width: 767px) 100vw, 50vw"
              style={{ objectPosition: "50% 60%" }}
            />
          </div>
          <div className="order-2 flex flex-col justify-center px-[var(--gutter)] py-[var(--section)] md:order-1 md:pr-[clamp(2.5rem,6vw,6rem)]">
            <h2 id="story-heading" className="t-title max-w-[14ch]">
              {story.headline.replace(/\.$/, "")}
            </h2>
            {story.body && <p className="t-body mt-6 !text-sand">{story.body}</p>}
            <p className="mt-6 text-sand">Founded by Hazera Khawaja</p>
            <Link href="/our-story" className="btn btn-light mt-8 self-start">
              Read our story
            </Link>
          </div>
        </div>
        {realAwards.length > 0 && (
          <div className="wrap border-t border-paper/15 py-12">
            <h3 className="sr-only">Awards and recognition</h3>
            <ul className="grid gap-8 md:grid-cols-3">
              {realAwards.map((a) => (
                <li key={a.title}>
                  <p className="price text-sand">{a.year}</p>
                  <p className="t-sub mt-1">{a.title}</p>
                  {a.detail && <p className="mt-1 text-[0.9375rem] text-sand">{a.detail}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* What to expect */}
      <section className="wrap section" aria-labelledby="order-heading">
        <h2 id="order-heading" className="t-head">
          Ordering from us
        </h2>
        <dl className="mt-9 grid gap-x-10 gap-y-8 border-t border-sand pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Shipping",
              d: `${formatINR(SHIPPING_FEE)} per order, free on orders of ${formatINR(FREE_SHIPPING_THRESHOLD)} and above.`,
              href: "/shipping-policy",
              l: "Shipping policy",
            },
            {
              t: "Payment",
              d: "Cash on delivery or bank transfer. Shipping is shown before you place your order.",
              href: "/terms",
              l: "Terms",
            },
            {
              t: "Confirmation",
              d: "Our team contacts you to confirm every order before it is dispatched.",
              href: "/contact",
              l: "Contact us",
            },
            {
              t: "Exchanges",
              d: "Size exchanges on unworn pieces with their original tags.",
              href: "/returns-policy",
              l: "Returns and exchanges",
            },
          ].map((x) => (
            <div key={x.t}>
              <dt className="t-sub">{x.t}</dt>
              <dd className="price mt-2 text-ink-soft">
                {x.d}
                <Link href={x.href} className="link mt-3 block w-fit text-[0.9375rem] text-ink">
                  {x.l}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
