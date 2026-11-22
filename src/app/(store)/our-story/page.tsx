import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { getContent } from "@/lib/data";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Our Story — Seven Years of Style, Passion & Purpose",
  description:
    "The journey of Haji Queens by Hazera Khawaja — seven years of modest and contemporary fashion for every woman.",
};

export const dynamic = "force-dynamic";

export default async function OurStoryPage() {
  const awards = await getContent<{ title: string; detail: string; year: string }[]>("awards", []);

  return (
    <div className="pb-24">
      {/* Editorial hero */}
      <header className="relative min-h-[52vh] overflow-hidden bg-espresso lg:min-h-[64vh]">
        <Image
          src="/images/story-atelier-2.jpg"
          alt="The Haji Queens atelier"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/30 to-espresso/20" />
        <div className="container-hq absolute inset-x-0 bottom-0 pb-12 lg:pb-16">
          <p className="kicker">Our Story</p>
          <h1 className="display-1 mt-3 max-w-3xl text-ivory">
            Seven Years of Style, Passion &amp; Purpose.
          </h1>
        </div>
      </header>

      <div className="container-hq-narrow">
        {/* 1 — Our beginning */}
        <Reveal className="py-14 lg:py-20">
          <p className="kicker">Our Beginning</p>
          <h2 className="display-2 mt-4 text-espresso">
            It started with a simple frustration.
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-espresso/75">
            <p>
              Finding clothing that felt modest without feeling like a compromise — elegant without
              excess, contemporary without losing its soul — was harder than it should have been.
              Haji Queens began as an answer to that gap: a small, considered edit for women who
              wanted both.
            </p>
            <p>
              What began as a personal search grew into a trusted atelier, serving women across
              occasions, professions and generations — women of every background who share one
              belief: that what you wear should feel like you.
            </p>
          </div>
        </Reveal>

        {/* 2 — Seven years */}
        <Reveal className="border-t border-border py-14 lg:py-20">
          <p className="kicker">Seven Years of Haji Queens</p>
          <h2 className="display-2 mt-4 text-espresso">Growth, the unhurried way.</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-espresso/75">
            <p>
              Over seven years, the edit has widened — from signature abayas to flowing maxis,
              indo-western fusion and corporate tailoring — but the method has not changed. Fabrics
              are felt before they are chosen. Silhouettes are worn and lived in before they are
              offered. Every addition must earn its place.
            </p>
            <p>
              Alongside our original designs, we now curate pieces from trusted supplier
              catalogues, reviewed and presented to the same single standard. Growth, for us, has
              never meant looseness.
            </p>
          </div>
        </Reveal>

        {/* 3 — Design philosophy */}
        <Reveal className="border-t border-border py-14 lg:py-20">
          <p className="kicker">Our Design Philosophy</p>
          <h2 className="display-2 mt-4 text-espresso">
            Minimal, not empty. Elegant, not decorated.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="img-zoom relative aspect-[4/5] bg-cream">
              <Image
                src="/images/story-atelier-1.jpg"
                alt="Design sketches and swatches"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-4 text-[15px] leading-relaxed text-espresso/75">
              <p>
                We design for real life — garments that move through long days, long flights,
                celebrations and boardrooms. That means fabric first, cut second, and detail last:
                a covered button, a bound seam, a hem that falls exactly where it should.
              </p>
              <p>
                Modesty and modernity are not opposites here. They are two expressions of the same
                idea — that a woman&rsquo;s presence speaks before her clothing does, and her
                clothing should never interrupt it.
              </p>
            </div>
          </div>
        </Reveal>

        {/* 4 — Fashion for every woman */}
        <Reveal className="border-t border-border py-14 lg:py-20">
          <p className="kicker">Fashion For Every Woman</p>
          <h2 className="display-2 mt-4 text-espresso">One edit. Every woman.</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-espresso/75">
            <p>
              Haji Queens serves Muslim and non-Muslim women alike — modest dressers, contemporary
              dressers, and everyone in between. Some women come to us for coverage; others come
              for the calm, confident silhouettes. Most, over time, come for both.
            </p>
            <p>
              You will never find our pieces divided into &ldquo;ours&rdquo; and
              &ldquo;yours&rdquo;. If it is in the collection, it was made to be worn by you.
            </p>
          </div>
        </Reveal>

        {/* 5 — Commitment to quality */}
        <Reveal className="border-t border-border py-14 lg:py-20">
          <p className="kicker">Our Commitment To Quality</p>
          <h2 className="display-2 mt-4 text-espresso">Chosen once, worn for years.</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-espresso/75">
            <p>
              Every garment that reaches you has been checked — fabric weight, stitch density,
              lining, drape — against a standard that has not loosened in seven years. If a piece
              does not meet it, it does not reach the collection.
            </p>
            <p>
              And because bodies are not standard sizes, our fit team assists personally with
              sizing, alterations and made-to-measure guidance.{" "}
              <Link href="/custom-measurements" className="underline decoration-gold underline-offset-2 hover:text-gold">
                Share your measurements
              </Link>{" "}
              and we will take it from there.
            </p>
          </div>
        </Reveal>

        {/* 6 — Awards */}
        {awards.length > 0 && (
          <Reveal className="border-t border-border py-14 lg:py-20">
            <p className="kicker">Awards &amp; Recognition</p>
            <h2 className="display-2 mt-4 text-espresso">Milestones on the way.</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {awards.map((a, i) => (
                <div key={i} className="border border-border bg-ivory p-6">
                  <p className="font-display text-3xl text-gold">{a.year}</p>
                  <h3 className="mt-2 font-display text-xl leading-snug text-espresso">{a.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-taupe">{a.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-taupe">
              Award entries shown are placeholders pending verified details.
            </p>
          </Reveal>
        )}

        {/* 7 — Founder */}
        <Reveal className="border-t border-border py-14 lg:py-20">
          <p className="kicker">Meet The Founder</p>
          <div className="mt-6 grid items-center gap-10 md:grid-cols-[1fr_1.4fr]">
            <div className="img-zoom relative aspect-[3/4] bg-cream">
              <Image
                src="/images/story-duo.jpg"
                alt="Haji Queens — founder"
                fill
                sizes="(max-width: 768px) 100vw, 35vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="display-2 text-espresso">Hazera Khawaja</h2>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-gold">
                Founder &amp; Creative Director
              </p>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-espresso/75">
                <p>
                  <em className="font-display text-lg text-espresso">
                    [&ldquo;A personal note from Hazera will be placed here — this is editable
                    placeholder copy.&rdquo;]
                  </em>
                </p>
                <p>
                  Hazera leads every selection personally, from fabric fairs to final fittings. Her
                  instinct — that modest fashion should feel current, joyful and unmistakably
                  feminine — shapes every piece that carries the Haji Queens name.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href="/shop" className="btn-hq-primary">
                  Shop The Collection
                </Link>
                {isWhatsAppConfigured() && (
                  <a
                    href={waGeneralLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hq-outline"
                  >
                    Say Hello
                  </a>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
