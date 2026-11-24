import Link from "next/link";
import { Wordmark } from "@/components/storefront/wordmark";
import { getContent } from "@/lib/data";
import { categoryLabel, publicContact, type ContactContent } from "@/lib/storefront";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";
import type { CategoryDTO } from "@/lib/types";

export async function Footer({ categories }: { categories: CategoryDTO[] }) {
  const [social, rawContact] = await Promise.all([
    getContent<{ instagram?: string; facebook?: string }>("social", {}),
    getContent<ContactContent>("contact", {}),
  ]);
  const contact = publicContact(rawContact);

  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "New arrivals", href: "/new-arrivals" },
        ...categories.map((c) => ({ label: categoryLabel(c), href: `/category/${c.slug}` })),
        { label: "Shop everything", href: "/shop" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Track an order", href: "/account" },
        { label: "Shipping", href: "/shipping-policy" },
        { label: "Returns and exchanges", href: "/returns-policy" },
        { label: "Made to your measure", href: "/custom-measurements" },
        { label: "Contact us", href: "/contact" },
      ],
    },
    {
      title: "Haji Queens",
      links: [
        { label: "Our story", href: "/our-story" },
        ...(social.instagram ? [{ label: "Instagram", href: social.instagram, external: true }] : []),
        ...(social.facebook ? [{ label: "Facebook", href: social.facebook, external: true }] : []),
        ...(isWhatsAppConfigured() ? [{ label: "WhatsApp", href: waGeneralLink(), external: true }] : []),
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="wrap grid gap-12 pb-14 pt-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:pt-20">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="t-sub max-w-[24ch]">Modest and contemporary fashion, seven years in the making.</p>
          {(contact.email || contact.phoneDisplay || contact.address || contact.hours) && (
            <address className="mt-6 space-y-1 not-italic text-[0.9375rem] text-sand">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="link inline-block py-1 text-paper decoration-paper/40">
                  {contact.email}
                </a>
              )}
              {contact.phoneDisplay && (
                <p>
                  <a href={`tel:${contact.phoneDisplay.replace(/[^\d+]/g, "")}`}>{contact.phoneDisplay}</a>
                </p>
              )}
              {contact.hours && <p>{contact.hours}</p>}
              {contact.address && <p>{contact.address}</p>}
            </address>
          )}
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[0.9375rem] font-medium text-sand">{col.title}</h2>
            <ul className="mt-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 transition-colors hover:text-sand">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="inline-block py-1.5 transition-colors hover:text-sand">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="wrap" aria-hidden="true">
        <Wordmark size="lg" className="!flex w-full overflow-hidden border-t border-paper/15 pb-6 pt-10" />
      </div>

      <div className="wrap flex flex-col gap-3 pb-8 pt-2 text-sm text-sand sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Haji Queens by Hazera Khawaja</p>
        <p className="flex gap-6">
          <Link href="/privacy-policy" className="py-1 hover:text-paper">
            Privacy
          </Link>
          <Link href="/terms" className="py-1 hover:text-paper">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
