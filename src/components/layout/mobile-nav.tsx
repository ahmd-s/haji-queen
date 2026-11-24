"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Sheet } from "@/components/storefront/sheet";
import { Wordmark } from "@/components/storefront/wordmark";
import { categoryLabel, categoryPhoto, photoPosition } from "@/lib/storefront";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";
import type { CategoryDTO } from "@/lib/types";

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
    <Sheet open={open} onClose={onClose} side="left" label="Menu">
      <div className="flex shrink-0 items-center justify-between py-3 pl-6 pr-3">
        <Wordmark size="sm" />
        <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex size-11 items-center justify-center">
          <X className="size-5" strokeWidth={1.4} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 pt-3" aria-label="Menu">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {open &&
            categories.map((c) => {
              const photo = categoryPhoto(c);
              return (
                <Link key={c.slug} href={`/category/${c.slug}`} onClick={onClose}>
                  <span className="photo block aspect-[4/5]">
                    {photo && (
                      <Image src={photo} alt="" fill sizes="180px" style={{ objectPosition: photoPosition(photo) ?? "50% 15%" }} />
                    )}
                  </span>
                  <span className="mt-2 block font-medium">{categoryLabel(c)}</span>
                </Link>
              );
            })}
        </div>

        <ul className="mt-7 border-t border-sand pt-4">
          {[
            { label: "New arrivals", href: "/new-arrivals" },
            { label: "Shop everything", href: "/shop" },
            { label: "Made to your measure", href: "/custom-measurements" },
            { label: "Our story", href: "/our-story" },
            { label: "Track an order", href: "/account" },
            { label: "Contact", href: "/contact" },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onClose} className="flex min-h-12 items-center text-[1.0625rem]">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {isWhatsAppConfigured() && (
        <div className="border-t border-sand p-5">
          <a href={waGeneralLink()} target="_blank" rel="noopener noreferrer" className="btn btn-solid w-full">
            Message us on WhatsApp
          </a>
        </div>
      )}
    </Sheet>
  );
}
