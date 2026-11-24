import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getContent } from "@/lib/data";
import { EDITORIAL, verifiedAwards, type Award } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Our Story: Seven Years of Style, Passion & Purpose",
  description:
    "The journey of Haji Queens by Hazera Khawaja: seven years of modest and contemporary fashion for every woman.",
};

export const dynamic = "force-dynamic";

export default async function OurStoryPage() {
  const awards = verifiedAwards(await getContent<Award[]>("awards", []));

  return (
    <>
      <header className="grid bg-ink text-paper md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col justify-end px-[var(--gutter)] py-[var(--section)]">
          <h1 className="t-hero max-w-[12ch]">Seven years of style, passion and purpose</h1>
          <p className="mt-7 text-[1.0625rem] text-sand">Haji Queens, by Hazera Khawaja</p>
        </div>
        <div className="photo aspect-[4/5] !bg-ink md:aspect-auto md:min-h-[46rem]">
          <Image
            src={EDITORIAL.storyPortrait}
            alt="Ruffled white blouse worn with a blush pink skirt trimmed with bows"
            fill
            quality={85}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 767px) 100vw, 46vw"
            style={{ objectPosition: "45% 40%" }}
          />
        </div>
      </header>

      <section className="wrap section grid gap-x-16 gap-y-6 md:grid-cols-[1fr_1.35fr]">
        <h2 className="t-title max-w-[12ch]">It started with a simple frustration</h2>
        <div className="space-y-5 md:pt-2">
          <p className="t-body">
            Finding clothing that felt modest without feeling like a compromise, elegant without excess, contemporary
            without losing its soul, was harder than it should have been. Haji Queens began as an answer to that gap: a
            small, considered edit for women who wanted both.
          </p>
          <p className="t-body">
            What began as a personal search grew to serve women across occasions, professions and generations. Women of
            every background who share one belief: that what you wear should feel like you.
          </p>
        </div>
      </section>

      <section className="wrap grid items-end gap-x-5 gap-y-5 md:grid-cols-[1fr_1.5fr]" aria-hidden="true">
        <div className="photo aspect-[4/5]">
          <Image src={EDITORIAL.storyRoom} alt="" fill sizes="(max-width: 767px) 100vw, 40vw" style={{ objectPosition: "45% 40%" }} />
        </div>
        <div className="photo aspect-[4/5] md:aspect-[5/4]">
          <Image src={EDITORIAL.storyDetail} alt="" fill loading="eager" sizes="(max-width: 767px) 100vw, 60vw" quality={85} style={{ objectPosition: "50% 62%" }} />
        </div>
      </section>

      <section className="wrap section grid gap-x-16 gap-y-14 md:grid-cols-2">
        <div>
          <h2 className="t-head">Growth, the unhurried way</h2>
          <p className="t-body mt-5">
            Over seven years the edit has widened, from signature abayas to flowing maxis, Indo-Western sets and
            workwear. Alongside our original designs we now present pieces from trusted supplier catalogues, held to the
            same standard. Every addition must earn its place.
          </p>
        </div>
        <div>
          <h2 className="t-head">Minimal, not empty</h2>
          <p className="t-body mt-5">
            We choose for real life: garments that move through long days, celebrations and working hours. Fabric first,
            cut second, detail last. Modesty and modernity are not opposites here. They are two expressions of the same
            idea.
          </p>
        </div>
        <div>
          <h2 className="t-head">One edit, every woman</h2>
          <p className="t-body mt-5">
            Haji Queens serves Muslim and non-Muslim women alike: modest dressers, contemporary dressers, and everyone in
            between. Some come for coverage, others for calm, confident silhouettes. Most, over time, come for both.
          </p>
        </div>
        <div>
          <h2 className="t-head">A fit that is yours</h2>
          <p className="t-body mt-5">
            Bodies are not standard sizes, so we help personally with sizing, alterations and made-to-measure guidance.{" "}
            <Link href="/custom-measurements" className="link text-ink">
              Send us your measurements
            </Link>{" "}
            and we will take it from there.
          </p>
        </div>
      </section>

      {awards.length > 0 && (
        <section className="bg-shell" aria-labelledby="awards-heading">
          <div className="wrap section">
            <h2 id="awards-heading" className="t-head">
              Awards and recognition
            </h2>
            <ul className="mt-8 divide-y divide-sand border-y border-sand">
              {awards.map((a) => (
                <li key={a.title} className="grid gap-x-10 gap-y-1 py-6 md:grid-cols-[6rem_1fr_1fr]">
                  <p className="price text-ink-soft">{a.year}</p>
                  <p className="t-sub">{a.title}</p>
                  <p className="text-ink-soft">{a.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-shell">
        <div className="wrap section grid items-end gap-x-16 gap-y-7 md:grid-cols-[1.35fr_1fr]">
          <div>
            <h2 className="t-title">Hazera Khawaja</h2>
            <p className="mt-2 text-[1.0625rem] text-ink-soft">Founder and creative director</p>
            <p className="t-body mt-6">
              Hazera leads the selection behind Haji Queens. Her instinct, that modest fashion should feel current,
              joyful and unmistakably feminine, shapes every piece that carries the name.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/new-arrivals" className="btn btn-solid">
              See new arrivals
            </Link>
            <Link href="/contact" className="btn btn-line">
              Say hello
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
