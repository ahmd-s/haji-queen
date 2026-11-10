"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type HeroContent = {
  headline: string;
  subtext: string;
  primaryCta: string;
  secondaryCta: string;
  image: string;
};

export function Hero({ content }: { content: HeroContent }) {
  const reduce = useReducedMotion();

  const ease = [0.22, 1, 0.36, 1] as const;
  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease },
        };

  return (
    <section className="relative bg-ivory" aria-label="Featured collection">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[46%_54%]">
        {/* Copy */}
        <div className="order-2 flex items-center px-5 pb-14 pt-12 md:px-10 lg:order-1 lg:py-0 lg:pl-16 xl:pl-24">
          <div className="max-w-xl">
            <motion.p
              {...fadeUp(0.05)}
              className="kicker"
            >
              Modest &amp; Contemporary · Est. 7 Years
            </motion.p>
            <motion.h1
              {...fadeUp(0.15)}
              className="display-1 mt-6 text-espresso text-balance"
            >
              {content.headline}
            </motion.h1>
            <motion.p
              {...fadeUp(0.28)}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-espresso/70"
            >
              {content.subtext}
            </motion.p>
            <motion.div {...fadeUp(0.4)} className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/shop" className="btn-hq-primary">
                {content.primaryCta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link href="/our-story" className="btn-hq-ghost">
                {content.secondaryCta}
              </Link>
            </motion.div>

            {/* Quiet trust line — no invented claims */}
            <motion.div
              {...fadeUp(0.55)}
              className="mt-12 hidden items-center gap-10 border-t border-border pt-6 lg:flex"
            >
              {[
                ["Abayas", "/category/abayas"],
                ["Maxis & Dresses", "/category/maxis-dresses"],
                ["Indo-Western", "/category/indo-western"],
                ["Workwear", "/category/corporate-workwear"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="link-underline text-[11px] font-medium uppercase tracking-[0.2em] text-taupe hover:text-espresso"
                >
                  {label}
                </Link>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Image */}
        <div className="relative order-1 min-h-[68vh] overflow-hidden bg-cream lg:order-2 lg:min-h-[86vh]">
          <motion.div
            initial={reduce ? false : { scale: 1.06, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease }}
            className="absolute inset-0"
          >
            <Image
              src={content.image}
              alt="Haji Queens campaign — elegant modest fashion"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover object-top"
            />
          </motion.div>
          {/* Corner geometry — quiet nod to the emblem */}
          <div
            aria-hidden="true"
            className="absolute right-6 top-6 hidden h-16 w-16 border border-ivory/60 lg:block"
          >
            <div className="absolute inset-1.5 border border-gold/50" />
          </div>
        </div>
      </div>
    </section>
  );
}
