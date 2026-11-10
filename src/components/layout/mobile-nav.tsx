"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import type { CategoryDTO } from "@/lib/types";
import { waGeneralLink, isWhatsAppConfigured } from "@/lib/whatsapp";
import { Instagram, Facebook } from "lucide-react";

export function MobileNav({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-espresso/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 left-0 z-[90] flex w-[86%] max-w-sm flex-col bg-ivory"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Logo compact />
              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center text-espresso hover:text-gold"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Mobile">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-taupe">
                Collections
              </p>
              <ul className="mt-3 space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      onClick={onClose}
                      className="flex items-baseline justify-between py-2.5 font-display text-[22px] text-espresso transition-colors hover:text-gold"
                    >
                      {c.name}
                      <span className="text-[11px] uppercase tracking-[0.2em] text-taupe">
                        Explore
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-6 h-px bg-border" />

              <ul className="space-y-1">
                {[
                  { label: "Shop All", href: "/shop" },
                  { label: "Our Story", href: "/our-story" },
                  { label: "Custom Measurements", href: "/custom-measurements" },
                  { label: "Wishlist", href: "/wishlist" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={onClose}
                      className="block py-2 text-[13px] font-medium uppercase tracking-[0.18em] text-espresso/80 transition-colors hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-border px-5 py-5">
              {isWhatsAppConfigured() && (
                <a
                  href={waGeneralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hq-primary w-full"
                >
                  Chat on WhatsApp
                </a>
              )}
              <div className="mt-4 flex items-center justify-center gap-6 text-taupe">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-gold"
                >
                  <Instagram className="h-5 w-5" strokeWidth={1.5} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:text-gold"
                >
                  <Facebook className="h-5 w-5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
