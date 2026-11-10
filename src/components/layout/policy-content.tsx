import { SITE_NAME } from "@/lib/site";

/**
 * Policy page templates. Copy is honest and generic — the business should
 * review and replace with verified operational details before launch.
 */
export const POLICIES = {
  "shipping-policy": {
    title: "Shipping Policy",
    updated: "V1 template — to be finalised with verified logistics details",
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
          `Shipping is calculated at checkout. Complimentary shipping applies to orders above ₹4,999 (amount configurable in the store settings). Any final adjustment is confirmed with you before dispatch.`,
        ],
      },
      {
        h: "Tracking & Support",
        p: [
          "You can track your order anytime via our order tracking page using your order number. Questions? Message us on WhatsApp — we reply personally.",
        ],
      },
    ],
  },
  "returns-policy": {
    title: "Returns & Exchange Policy",
    updated: "V1 template — to be finalised with verified operational details",
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
          "Message us on WhatsApp or email with your order number. Our team will guide you through the next steps personally.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    updated: "V1 template — review with your data-protection obligations before launch",
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
    updated: "V1 template — review with legal counsel before launch",
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

export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const policy = POLICIES[slug];
  return (
    <div className="container-hq-narrow py-14 lg:py-20">
      <p className="kicker">Client Care</p>
      <h1 className="display-1 mt-4 text-espresso">{policy.title}</h1>
      <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-taupe">{policy.updated}</p>
      <div className="mt-10 max-w-2xl space-y-9">
        {policy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl text-espresso">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-3 text-[14.5px] leading-relaxed text-espresso/75">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
