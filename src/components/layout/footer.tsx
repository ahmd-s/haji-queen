import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Instagram, Facebook, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import type { CategoryDTO } from "@/lib/types";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";
import { getContent } from "@/lib/data";

type ContactContent = { email?: string; phoneDisplay?: string; address?: string; hours?: string };

export async function Footer({ categories }: { categories: CategoryDTO[] }) {
  const social = await getContent<{ instagram?: string; facebook?: string }>("social", {});
  const contact = await getContent<ContactContent>("contact", {});

  return (
    <footer className="mt-auto bg-espresso text-ivory">
      <div className="container-hq grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <Logo dark />
          <p className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-champagne/85">
            Seven years of thoughtfully curated modest and contemporary fashion — designed for
            women who dress with intention, for every occasion and every day.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a
              href={social.instagram || "https://instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-10 w-10 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
            >
              <Instagram className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </a>
            <a
              href={social.facebook || "https://facebook.com"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex h-10 w-10 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
            >
              <Facebook className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </a>
            {isWhatsAppConfigured() && (
              <a
                href={waGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-10 w-10 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
              >
                <MessageCircle className="h-[17px] w-[17px]" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>

        {/* Shop */}
        <nav aria-label="Shop">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne/70">
            Shop
          </h3>
          <ul className="mt-5 space-y-3 text-[13.5px] text-ivory/90">
            <li>
              <Link href="/shop" className="transition-colors hover:text-gold">
                All Collections
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="transition-colors hover:text-gold">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Company */}
        <nav aria-label="Company">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne/70">
            Company
          </h3>
          <ul className="mt-5 space-y-3 text-[13.5px] text-ivory/90">
            <li>
              <Link href="/our-story" className="transition-colors hover:text-gold">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/custom-measurements" className="transition-colors hover:text-gold">
                Custom Measurements
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-gold">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/account" className="transition-colors hover:text-gold">
                Track Your Order
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact & policies */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-champagne/70">
            Client Care
          </h3>
          <ul className="mt-5 space-y-3 text-[13.5px] text-ivory/90">
            {contact.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-gold">
                  {contact.email}
                </a>
              </li>
            )}
            {isWhatsAppConfigured() && (
              <li className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <a
                  href={waGeneralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gold"
                >
                  WhatsApp Us
                </a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span className="text-ivory/80">{contact.address}</span>
              </li>
            )}
            {contact.hours && (
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span className="text-ivory/80">{contact.hours}</span>
              </li>
            )}
          </ul>
          <ul className="mt-6 space-y-2 border-t border-ivory/10 pt-5 text-[12px] text-ivory/70">
            <li>
              <Link href="/shipping-policy" className="transition-colors hover:text-gold">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/returns-policy" className="transition-colors hover:text-gold">
                Returns &amp; Exchange Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="transition-colors hover:text-gold">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-gold">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-hq flex flex-col items-center justify-between gap-2 py-5 text-[11px] tracking-wide text-ivory/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Haji Queens · By Hazera Khawaja. All rights reserved.</p>
          <p>Crafted with intention · hajiqueens.com</p>
        </div>
      </div>
    </footer>
  );
}
