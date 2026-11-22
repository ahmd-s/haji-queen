import type { Metadata } from "next";
import { ArrowLeft, Mail, MapPin, Clock, MessageCircle, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { getContent, getProductBySlug } from "@/lib/data";
import { AVAILABILITY_LABEL, normaliseAvailability } from "@/lib/availability";
import { formatINR } from "@/lib/money";
import { SITE_URL } from "@/lib/site";
import { isWhatsAppConfigured, waGeneralLink, waProductLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach the Haji Queens client care team — WhatsApp, email or visit us.",
};

export const dynamic = "force-dynamic";

type ContactContent = {
  email?: string;
  phoneDisplay?: string;
  address?: string;
  hours?: string;
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [{ product: slug }, contact, social] = await Promise.all([
    searchParams,
    getContent<ContactContent>("contact", {}),
    getContent<{ instagram?: string; facebook?: string }>("social", {}),
  ]);

  const product = slug ? await getProductBySlug(slug) : null;
  const variantLabel = product
    ? [product.colors.map((c) => c.name).join(" / "), product.sizes.length ? `Sizes ${product.sizes.join(", ")}` : ""]
        .filter(Boolean)
        .join(" · ")
    : "";
  const productUrl = product ? `${SITE_URL}/product/${product.slug}` : "";
  const emailSubject = product ? `Enquiry: ${product.name}` : "Hello Haji Queens";
  const emailBody = product
    ? [
        "Hello Haji Queens,",
        "",
        `I would like to know more about ${product.name}.`,
        variantLabel ? `Interested in: ${variantLabel}` : "",
        productUrl,
        "",
        "Please share the current price, available options and dispatch details.",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="container-hq-narrow py-14 lg:py-20">
      <p className="kicker">Client Care</p>
      <h1 className="display-1 mt-4 text-espresso">We&rsquo;re Here To Help</h1>
      <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-espresso/70">
        Sizing advice, order updates, styling questions — our team replies personally, usually
        within a few hours.
      </p>

      {product && (
        <section
          aria-labelledby="product-enquiry-heading"
          className="mt-9 border border-gold/40 bg-cream/40 p-6 lg:p-7"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
            Product enquiry
          </p>
          <h2 id="product-enquiry-heading" className="mt-2 font-display text-2xl text-espresso">
            {product.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-espresso/70">
            <span className="font-semibold text-gold-deep">
              {product.priceConfirmed && product.price > 0 ? formatINR(product.price) : "Price Pending"}
            </span>
            <span>{AVAILABILITY_LABEL[normaliseAvailability(product.availability)]}</span>
            {variantLabel && <span className="text-espresso/60">{variantLabel}</span>}
          </div>
          {!product.priceConfirmed && (
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-espresso/70">
              This piece is listed for enquiry only. The customer-facing price is not confirmed
              yet, so online checkout is paused while we finalise the details.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                className="btn-hq-primary"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                Email about this piece
              </a>
            )}
            {contact.phoneDisplay && (
              <a href={`tel:${contact.phoneDisplay.replace(/[^\d+]/g, "")}`} className="btn-hq-outline">
                Call {contact.phoneDisplay}
              </a>
            )}
            {isWhatsAppConfigured() && (
              <a
                href={waProductLink(product.name, productUrl, variantLabel || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hq-outline"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                WhatsApp
              </a>
            )}
            <Link href={`/product/${product.slug}`} className="inline-flex items-center px-2 text-[12.5px] font-medium text-espresso/70 underline-offset-4 hover:text-gold hover:underline">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to product
            </Link>
          </div>
          {!contact.email && !contact.phoneDisplay && !isWhatsAppConfigured() && (
            <p className="mt-4 text-[12.5px] text-gold-deep">
              Contact details are being finalised. Please check back shortly or use the general
              enquiry options below.
            </p>
          )}
        </section>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {isWhatsAppConfigured() && (
          <a
            href={waGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 border border-border p-6 transition-colors hover:border-gold"
          >
            <MessageCircle className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span>
              <span className="block font-display text-xl text-espresso group-hover:text-gold">
                WhatsApp
              </span>
              <span className="mt-1 block text-[13px] text-espresso/65">
                Fastest replies — styling, sizing and order help.
              </span>
            </span>
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
            className="group flex items-start gap-4 border border-border p-6 transition-colors hover:border-gold"
          >
            <Mail className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span>
              <span className="block font-display text-xl text-espresso group-hover:text-gold">
                Email
              </span>
              <span className="mt-1 block text-[13px] text-espresso/65">{contact.email}</span>
            </span>
          </a>
        )}
        {contact.phoneDisplay && (
          <a
            href={`tel:${contact.phoneDisplay.replace(/[^\d+]/g, "")}`}
            className="group flex items-start gap-4 border border-border p-6 transition-colors hover:border-gold"
          >
            <MessageCircle className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span>
              <span className="block font-display text-xl text-espresso group-hover:text-gold">
                Phone
              </span>
              <span className="mt-1 block text-[13px] text-espresso/65">{contact.phoneDisplay}</span>
            </span>
          </a>
        )}
        {contact.address && (
          <div className="flex items-start gap-4 border border-border p-6">
            <MapPin className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span>
              <span className="block font-display text-xl text-espresso">Visit / Studio</span>
              <span className="mt-1 block text-[13px] text-espresso/65">{contact.address}</span>
            </span>
          </div>
        )}
        {contact.hours && (
          <div className="flex items-start gap-4 border border-border p-6">
            <Clock className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
            <span>
              <span className="block font-display text-xl text-espresso">Hours</span>
              <span className="mt-1 block text-[13px] text-espresso/65">{contact.hours}</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-5">
        <a
          href={social.instagram || "https://instagram.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center border border-border text-espresso transition-colors hover:border-gold hover:text-gold"
          aria-label="Instagram"
        >
          <Instagram className="h-5 w-5" strokeWidth={1.5} />
        </a>
        <a
          href={social.facebook || "https://facebook.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center border border-border text-espresso transition-colors hover:border-gold hover:text-gold"
          aria-label="Facebook"
        >
          <Facebook className="h-5 w-5" strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}
