import type { Metadata } from "next";
import Link from "next/link";
import { isWhatsAppConfigured, waGeneralLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order Received",
  robots: { index: false },
};

/**
 * Order confirmation. No payment-success claims are made here — payment
 * status is managed by the business. The Meta Purchase event fires only
 * after an order is verified as PAID (admin marks payment received).
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="wrap-text min-h-[64vh] pb-[var(--section)] pt-12 md:pt-20">
      <h1 className="t-title">Thank you. We have your order.</h1>
      {order && (
        <p className="mt-7 inline-block bg-shell px-6 py-4">
          Order number <span className="price ml-1 font-medium">{order}</span>
        </p>
      )}

      <h2 className="t-sub mt-12">What happens next</h2>
      <ol className="mt-5 max-w-[54ch] divide-y divide-sand border-y border-sand">
        {[
          "We contact you by phone, email or WhatsApp to confirm your pieces, sizes and address.",
          "If you chose bank transfer, we share the account details with you then. This page is not a payment receipt.",
          "Once everything is confirmed, your order is prepared and dispatched.",
        ].map((t, i) => (
          <li key={t} className="flex gap-5 py-4">
            <span className="price font-medium">{i + 1}</span>
            <span className="text-ink-soft">{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link href="/shop" className="btn btn-solid">
          Continue shopping
        </Link>
        <Link href="/account" className="btn btn-line">
          Track this order
        </Link>
        {isWhatsAppConfigured() && (
          <a href={waGeneralLink()} target="_blank" rel="noopener noreferrer" className="link px-3 py-2">
            Ask about my order
          </a>
        )}
      </div>
    </div>
  );
}
