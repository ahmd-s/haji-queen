import Link from "next/link";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Policy copy. The business should review it and replace it with verified
 * operational details; nothing here should promise more than is delivered.
 */
export const POLICIES = {
  "shipping-policy": {
    title: "Shipping Policy",
    sections: [
      {
        h: "Order Confirmation",
        p: [
          "Every order is reviewed and confirmed personally by our team before dispatch — by phone, email or WhatsApp. Orders are prepared once details are confirmed.",
        ],
      },
      {
        h: "Dispatch & Timelines",
        p: [
          "Dispatch timelines vary by piece and destination, and are shared with you at confirmation. Made-to-measure and alteration requests require additional time, which our team will communicate clearly.",
        ],
      },
      {
        h: "Shipping Charges",
        p: [
          `Shipping is ${formatINR(SHIPPING_FEE)} per order, and free on orders of ${formatINR(FREE_SHIPPING_THRESHOLD)} and above. The charge is shown at checkout before you place your order. Any final adjustment is confirmed with you before dispatch.`,
        ],
      },
      {
        h: "Tracking & Support",
        p: [
          "You can track your order anytime via our order tracking page using your order number. Questions? Contact us and we will reply personally.",
        ],
      },
    ],
  },
  "returns-policy": {
    title: "Returns & Exchange Policy",
    sections: [
      {
        h: "Our Approach",
        p: [
          "We want you to feel beautiful in every piece. If something is not right, contact us first — most concerns can be resolved quickly through a conversation.",
        ],
      },
      {
        h: "Exchange Requests",
        p: [
          "Exchanges for size are supported on unworn, unwashed pieces with original tags, requested within the window shared at order confirmation. Made-to-measure and altered pieces are exchanged only for manufacturing defects.",
        ],
      },
      {
        h: "Defects & Damages",
        p: [
          "If a piece arrives damaged or with a defect, notify us within 48 hours of delivery with photographs. We will repair, replace or refund as appropriate.",
        ],
      },
      {
        h: "How To Request",
        p: [
          "Contact us with your order number. Our team will guide you through the next steps personally.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    sections: [
      {
        h: "What We Collect",
        p: [
          "Order details you provide at checkout (name, contact, delivery address). Measurement and sizing details you choose to share for custom fit assistance. Basic usage data such as pages visited, collected only with your cookie consent.",
        ],
      },
      {
        h: "How We Use It",
        p: [
          "To process and deliver your orders, to provide sizing and alteration assistance, and — only with your explicit consent — to understand how our collections reach new customers through marketing tools such as the Meta Pixel.",
        ],
      },
      {
        h: "Measurement Data",
        p: [
          "Measurements are sensitive personal information. They are stored securely, used solely for sizing assistance, and accessible only to authorised staff. You may request deletion at any time by contacting us.",
        ],
      },
      {
        h: "Cookies & Marketing",
        p: [
          "Marketing cookies (including the Meta Pixel) load only after you accept them in our consent banner. Declining keeps your experience fully functional with essential cookies only. You can change your choice by clearing site data.",
        ],
      },
      {
        h: "Your Choices",
        p: [
          "You may request access, correction or deletion of your personal data by writing to us. We never sell your personal information.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    sections: [
      {
        h: "The Service",
        p: [
          `${SITE_NAME} operates this online store for the sale of women's fashion. By placing an order you confirm you are providing accurate details and are authorised to use the chosen payment method.`,
        ],
      },
      {
        h: "Orders & Acceptance",
        p: [
          "An order is accepted when our team confirms it personally. In the rare case an item becomes unavailable, we will inform you and refund any amount paid for it.",
        ],
      },
      {
        h: "Pricing & Payment",
        p: [
          "All prices are listed in Indian Rupees and include applicable taxes where required. Payment options are shown at checkout. Online payment is processed by our payment partner when activated.",
        ],
      },
      {
        h: "Product Presentation",
        p: [
          "We photograph pieces to represent them faithfully; slight variations in colour may occur across screens. Custom and made-to-measure pieces follow the measurements confirmed with our fit team.",
        ],
      },
      {
        h: "Content & Brand",
        p: [
          "All photography, copy and brand assets on this site belong to Haji Queens and may not be reproduced without permission.",
        ],
      },
    ],
  },
} as const;

export type PolicySlug = keyof typeof POLICIES;

const NAV: { slug: PolicySlug; label: string }[] = [
  { slug: "shipping-policy", label: "Shipping" },
  { slug: "returns-policy", label: "Returns and exchanges" },
  { slug: "privacy-policy", label: "Privacy" },
  { slug: "terms", label: "Terms" },
];

export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const policy = POLICIES[slug];
  return (
    <div className="wrap pb-[var(--section)] pt-10 md:pt-16">
      <h1 className="t-title">{policy.title}</h1>
      <div className="mt-9 grid gap-x-16 gap-y-10 md:mt-14 md:grid-cols-[14rem_1fr]">
        <nav aria-label="Policies" className="h-fit md:sticky md:top-28">
          <ul className="flex flex-wrap gap-x-6 md:block">
            {NAV.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/${n.slug}`}
                  aria-current={n.slug === slug ? "page" : undefined}
                  className={cn("inline-block py-1.5", n.slug === slug ? "font-medium" : "text-ink-soft hover:text-ink")}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-[44rem] divide-y divide-sand border-t border-sand">
          {policy.sections.map((s) => (
            <section key={s.h} className="py-7">
              <h2 className="t-sub">{s.h}</h2>
              {s.p.map((para) => (
                <p key={para} className="t-body mt-3">
                  {para}
                </p>
              ))}
            </section>
          ))}
          <p className="py-7">
            A question this page does not answer?{" "}
            <Link href="/contact" className="link">
              Ask us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
