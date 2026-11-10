import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Ruler, MessageCircle } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { ProductCard } from "@/components/product/product-card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { getCategories, getContent, getProducts } from "@/lib/data";
import { isWhatsAppConfigured, waMeasurementLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const FALLBACK_HERO = {
  headline: "Elegance, Woven Into Every Detail.",
  subtext:
    "Discover thoughtfully curated fashion that celebrates individuality, confidence and timeless elegance.",
  primaryCta: "Explore Collection",
  secondaryCta: "Discover Our Story",
  image: "/images/hero-main.jpg",
};

export default async function HomePage() {
  const [hero, story, curated, measurements, awards, social, categories, featured, newest] =
    await Promise.all([
      getContent("hero", FALLBACK_HERO),
      getContent<{ headline: string; body: string; image: string }>("story", {
        headline: "Seven Years of Style, Passion & Purpose.",
        body: "What began as a personal search for clothing that felt both modest and magnetic has grown, over seven years, into a considered atelier serving women of every background. Every piece in our edit is chosen — never chased — for its fabric, its finish and the way it makes the wearer feel.",
        image: "/images/story-duo.jpg",
      }),
      getContent<{ headline: string; body: string }>("curated", {
        headline: "The Curated Collections",
        body: "Alongside our original designs, we present pieces from trusted supplier catalogues — each one reviewed, styled and photographed to the same standard. One edit. One standard of elegance.",
      }),
      getContent<{ headline: string; body: string }>("measurements", {
        headline: "Made To Fit You.",
        body: "Bodies are not standard sizes — we know. Share your measurements and our team will personally assist you with sizing, alterations and made-to-measure guidance.",
      }),
      getContent<{ title: string; detail: string; year: string }[]>("awards", []),
      getContent<{ instagram?: string; instagramHandle?: string; gallery?: string[] }>("social", {}),
      getCategories(),
      getProducts({ featuredOnly: true, limit: 8, sort: "popular" }),
      getProducts({ limit: 4, sort: "newest" }),
    ]);

  const featuredList = featured.length >= 4 ? featured : [...featured, ...newest].slice(0, 8);
  const gallery = social.gallery ?? [];

  return (
    <>
      <Hero content={hero} />

      {/* ── Featured categories — asymmetric editorial grid ── */}
      <section className="container-hq py-20 lg:py-28" aria-labelledby="collections-heading">
        <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker">The Collections</p>
            <h2 id="collections-heading" className="display-2 mt-4 max-w-xl text-espresso">
              Four moods. One standard of elegance.
            </h2>
          </div>
          <Link
            href="/shop"
            className="link-underline hidden text-[12px] font-semibold uppercase tracking-[0.2em] text-espresso md:block"
          >
            View all collections
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {categories[0] && (
            <Reveal className="md:col-span-7">
              <CategoryTile category={categories[0]} aspect="aspect-[4/3] md:aspect-[16/13]" large />
            </Reveal>
          )}
          {categories[1] && (
            <Reveal delay={0.1} className="md:col-span-5">
              <CategoryTile category={categories[1]} aspect="aspect-[4/3] md:aspect-[16/13] md:h-full" />
            </Reveal>
          )}
          {categories[2] && (
            <Reveal className="md:col-span-5">
              <CategoryTile category={categories[2]} aspect="aspect-[4/3] md:aspect-[16/13] md:h-full" />
            </Reveal>
          )}
          {categories[3] && (
            <Reveal delay={0.1} className="md:col-span-7">
              <CategoryTile category={categories[3]} aspect="aspect-[4/3] md:aspect-[16/13]" />
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="border-y border-border bg-cream/50 py-20 lg:py-28" aria-labelledby="featured-heading">
        <div className="container-hq">
          <Reveal className="mb-12 text-center">
            <p className="kicker kicker-center justify-center">Handpicked</p>
            <h2 id="featured-heading" className="display-2 mx-auto mt-4 max-w-2xl text-espresso">
              Curated For Your Everyday Elegance
            </h2>
          </Reveal>

          <StaggerGroup className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {featuredList.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal className="mt-14 text-center">
            <Link href="/shop" className="btn-hq-outline">
              View All Collection
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Brand story ── */}
      <section className="container-hq py-20 lg:py-28" aria-labelledby="story-heading">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative">
              <div className="img-zoom relative aspect-[4/5] w-full max-w-[520px] bg-cream">
                {story.image && (
                  <Image
                    src={story.image}
                    alt="Haji Queens — brand story"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -right-5 -z-10 hidden h-40 w-40 border border-gold/40 md:block"
              />
              <p className="absolute -left-3 top-8 hidden -rotate-90 text-[10px] font-semibold uppercase tracking-[0.4em] text-taupe lg:block">
                Since our first stitch
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="kicker">Our Story</p>
            <h2 id="story-heading" className="display-2 mt-4 text-espresso">
              {story.headline}
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-espresso/70">{story.body}</p>
            <div className="mt-8 flex flex-wrap gap-10 border-t border-border pt-8">
              <div>
                <p className="font-display text-4xl text-gold">7</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-taupe">Years of craft</p>
              </div>
              <div>
                <p className="font-display text-4xl text-gold">2</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-taupe">
                  Worlds — modest &amp; contemporary
                </p>
              </div>
              <div>
                <p className="font-display text-4xl text-gold">1</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-taupe">
                  Standard — never compromised
                </p>
              </div>
            </div>
            <Link href="/our-story" className="btn-hq-outline mt-10">
              Read Our Story
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Curated collections note ── */}
      <section className="bg-espresso py-16 lg:py-20" aria-labelledby="curated-heading">
        <div className="container-hq flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <Reveal className="max-w-2xl">
            <p className="kicker">Sourced With Care</p>
            <h2 id="curated-heading" className="display-3 mt-3 text-ivory">
              {curated.headline}
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-champagne/85">{curated.body}</p>
          </Reveal>
          <Reveal delay={0.1} className="shrink-0">
            <Link
              href="/shop"
              className="btn-hq border border-gold/60 text-gold hover:bg-gold hover:text-espresso"
            >
              Explore The Edit
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Custom measurements ── */}
      <section className="container-hq py-20 lg:py-28" aria-labelledby="fit-heading">
        <div className="grid items-stretch gap-0 overflow-hidden border border-border lg:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[320px] bg-cream">
            <Image
              src="/images/story-atelier-2.jpg"
              alt="Atelier — fabrics and fittings"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-champagne/40 p-8 md:p-14">
            <Reveal>
              <p className="kicker">Custom Measurements</p>
              <h2 id="fit-heading" className="display-2 mt-4 text-espresso">
                {measurements.headline}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-espresso/75">
                {measurements.body}
              </p>
              <ul className="mt-6 space-y-2.5 text-[13.5px] text-espresso/75">
                {[
                  "Personal sizing assistance from our team",
                  "Alteration guidance for your exact fit",
                  "Consultation at a time that suits you",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="h-1 w-1 bg-gold" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/custom-measurements" className="btn-hq-primary">
                  <Ruler className="h-4 w-4" strokeWidth={1.5} />
                  Book Your Measurement
                </Link>
                {isWhatsAppConfigured() && (
                  <a
                    href={waMeasurementLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hq-ghost"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    Ask on WhatsApp
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Awards & recognition (editable placeholders) ── */}
      {awards.length > 0 && (
        <section className="border-y border-border bg-cream/50 py-16 lg:py-20" aria-labelledby="awards-heading">
          <div className="container-hq">
            <Reveal className="mb-10 text-center">
              <p className="kicker kicker-center justify-center">Recognition</p>
              <h2 id="awards-heading" className="display-3 mt-3 text-espresso">
                Awards &amp; Recognition
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-taupe">
                Milestones from our journey — details are being updated as they are verified.
              </p>
            </Reveal>
            <StaggerGroup className="grid gap-5 md:grid-cols-3">
              {awards.map((a, i) => (
                <StaggerItem key={i}>
                  <div className="h-full border border-border bg-ivory p-7 text-center transition-colors hover:border-gold/50">
                    <p className="font-display text-3xl text-gold">{a.year}</p>
                    <h3 className="mt-3 font-display text-xl leading-snug text-espresso">{a.title}</h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-taupe">{a.detail}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      {/* ── Instagram / social gallery ── */}
      {gallery.length > 0 && (
        <section className="py-20 lg:py-28" aria-labelledby="social-heading">
          <div className="container-hq">
            <Reveal className="mb-12 text-center">
              <p className="kicker kicker-center justify-center">Follow The Journey</p>
              <h2 id="social-heading" className="display-3 mt-3 text-espresso">
                <a
                  href={social.instagram || "https://instagram.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  {social.instagramHandle || "@hajiqueens"}
                </a>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[13px] text-taupe">
                Styling notes, new arrivals and moments from the world of Haji Queens.
              </p>
            </Reveal>
            <StaggerGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {gallery.slice(0, 6).map((src, i) => (
                <StaggerItem key={src + i}>
                  <a
                    href={social.instagram || "https://instagram.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="img-zoom group relative block aspect-square overflow-hidden bg-cream"
                    aria-label={`Open Instagram post ${i + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`Haji Queens on Instagram ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 16vw"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-espresso/0 opacity-0 transition-all duration-300 group-hover:bg-espresso/30 group-hover:opacity-100">
                      <ArrowUpRight className="h-5 w-5 text-ivory" />
                    </span>
                  </a>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}
    </>
  );
}

function CategoryTile({
  category,
  aspect,
  large = false,
}: {
  category: { slug: string; name: string; tagline: string | null; tileImage: string | null };
  aspect: string;
  large?: boolean;
}) {
  return (
    <Link href={`/category/${category.slug}`} className="group block h-full">
      <div className={`img-zoom relative h-full w-full overflow-hidden bg-cream ${aspect}`}>
        {category.tileImage && (
          <Image
            src={category.tileImage}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-espresso/5 to-transparent transition-opacity duration-500 group-hover:from-espresso/65" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:p-8">
          <div>
            <h3 className={`font-display text-ivory ${large ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
              {category.name}
            </h3>
            {category.tagline && (
              <p className="mt-1 text-[12.5px] italic tracking-wide text-champagne/90">
                {category.tagline}
              </p>
            )}
          </div>
          <span className="mb-1 inline-flex h-10 w-10 items-center justify-center border border-ivory/40 text-ivory transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-espresso">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
