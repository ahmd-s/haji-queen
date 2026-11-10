import type { Metadata } from "next";
import { Mail, MapPin, Clock, MessageCircle, Instagram, Facebook } from "lucide-react";
import { getContent } from "@/lib/data";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach the Haji Queens client care team — WhatsApp, email or visit us.",
};

export const dynamic = "force-dynamic";

type ContactContent = { email?: string; phoneDisplay?: string; address?: string; hours?: string };

export default async function ContactPage() {
  const [contact, social] = await Promise.all([
    getContent<ContactContent>("contact", {}),
    getContent<{ instagram?: string; facebook?: string }>("social", {}),
  ]);

  return (
    <div className="container-hq-narrow py-14 lg:py-20">
      <p className="kicker">Client Care</p>
      <h1 className="display-1 mt-4 text-espresso">We&rsquo;re Here To Help</h1>
      <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-espresso/70">
        Sizing advice, order updates, styling questions — our team replies personally, usually
        within a few hours.
      </p>

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
            href={`mailto:${contact.email}`}
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
