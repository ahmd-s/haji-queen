import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EnquiryForm } from "@/components/storefront/enquiry-form";
import { getContent, getProductBySlug } from "@/lib/data";
import { formatINR } from "@/lib/money";
import { SITE_URL } from "@/lib/site";
import {
  colourPhotos,
  hasPrice,
  photoPosition,
  publicContact,
  statusLabel,
  type ContactContent,
} from "@/lib/storefront";
import { isWhatsAppConfigured, waGeneralLink, waProductLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Ask Haji Queens about sizing, a piece you love, or an order.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; colour?: string; size?: string }>;
}) {
  const [{ product: slug, colour: colourParam, size: sizeParam }, rawContact, social] = await Promise.all([
    searchParams,
    getContent<ContactContent>("contact", {}),
    getContent<{ instagram?: string; facebook?: string }>("social", {}),
  ]);
  const contact = publicContact(rawContact);

  const product = slug ? await getProductBySlug(slug) : null;
  const colour = product?.colors.find((c) => c.name === colourParam);
  const size = product?.sizes.find((s) => s === sizeParam);
  const photo = product ? colourPhotos(product, colour ?? product.colors[0])[0] : undefined;
  const productUrl = product ? `${SITE_URL}/product/${product.slug}` : "";
  const choice = [colour?.name, size && `Size ${size}`].filter(Boolean).join(", ");
  const mailto = contact.email
    ? `mailto:${contact.email}${
        product
          ? `?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}&body=${encodeURIComponent(
              `Hello Haji Queens,\n\nI would like to know more about ${product.name}${choice ? ` (${choice})` : ""}.\n${productUrl}\n`
            )}`
          : ""
      }`
    : null;

  const ways = [
    ...(isWhatsAppConfigured()
      ? [
          {
            label: "WhatsApp",
            value: "Message us",
            href: product ? waProductLink(product.name, productUrl, choice || undefined) : waGeneralLink(),
            external: true,
          },
        ]
      : []),
    ...(mailto ? [{ label: "Email", value: contact.email!, href: mailto, external: false }] : []),
    ...(contact.phoneDisplay
      ? [
          {
            label: "Phone",
            value: contact.phoneDisplay,
            href: `tel:${contact.phoneDisplay.replace(/[^\d+]/g, "")}`,
            external: false,
          },
        ]
      : []),
    ...(social.instagram ? [{ label: "Instagram", value: "Haji Queens", href: social.instagram, external: true }] : []),
    ...(social.facebook ? [{ label: "Facebook", value: "Haji Queens", href: social.facebook, external: true }] : []),
  ];

  return (
    <div className="wrap pb-[var(--section)] pt-10 md:pt-16">
      <h1 className="t-title">{product ? "Ask about this piece" : "Talk to us"}</h1>
      <p className="t-body mt-4">
        {product
          ? "Tell us what you would like to know and our team will reply to you personally."
          : "Sizing, styling, an order you have placed: send us a note and our team will reply to you personally."}
      </p>

      <div className="mt-10 grid gap-x-[clamp(2.5rem,7vw,7rem)] gap-y-12 lg:grid-cols-[1.35fr_1fr]">
        <div>
          {product && (
            <Link
              href={`/product/${product.slug}${colour ? `?colour=${encodeURIComponent(colour.name)}` : ""}`}
              className="mb-8 flex gap-5 bg-shell"
            >
              {photo && (
                <span className="photo block aspect-[3/4] w-28 shrink-0 sm:w-32">
                  <Image src={photo} alt="" fill sizes="128px" style={{ objectPosition: photoPosition(photo) }} />
                </span>
              )}
              <span className="flex min-w-0 flex-col justify-center py-4 pr-5">
                <span className="t-sub">{product.name}</span>
                <span className="price mt-1.5">
                  {hasPrice(product) ? formatINR(product.price) : "Price on request"}
                </span>
                <span className="mt-0.5 text-[0.9375rem] text-ink-soft">{choice || statusLabel(product)}</span>
              </span>
            </Link>
          )}
          <EnquiryForm
            product={
              product
                ? { name: product.name, slug: product.slug, url: productUrl, colour: colour?.name, size }
                : undefined
            }
          />
        </div>

        <aside className="h-fit border-t border-sand lg:mt-1">
          <dl className="divide-y divide-sand border-b border-sand">
            {ways.map((w) => (
              <div key={w.label} className="flex flex-wrap items-baseline justify-between gap-x-6 py-4">
                <dt className="text-ink-soft">{w.label}</dt>
                <dd>
                  <a
                    href={w.href}
                    {...(w.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="link break-all"
                  >
                    {w.value}
                  </a>
                </dd>
              </div>
            ))}
            {contact.hours && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 py-4">
                <dt className="text-ink-soft">Hours</dt>
                <dd>{contact.hours}</dd>
              </div>
            )}
            {contact.address && (
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 py-4">
                <dt className="text-ink-soft">Based in</dt>
                <dd>{contact.address}</dd>
              </div>
            )}
          </dl>
          <ul className="mt-6 space-y-1">
            {[
              ["/account", "Track an order"],
              ["/shipping-policy", "Shipping"],
              ["/returns-policy", "Returns and exchanges"],
              ["/custom-measurements", "Made to your measure"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="link inline-block py-1.5">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
