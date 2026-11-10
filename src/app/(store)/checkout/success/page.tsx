import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
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
    <div className="container-hq flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold/50">
        <CheckCircle2 className="h-7 w-7 text-gold" strokeWidth={1.5} />
      </span>
      <h1 className="display-1 mt-6 text-espresso">Thank You</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-espresso/70">
        Your order has been received by our team.
      </p>
      {order && (
        <p className="mt-5 border border-border bg-cream/50 px-6 py-3 text-[13px] tracking-wide text-espresso">
          Order number <span className="font-bold text-gold-deep">{order}</span>
        </p>
      )}
      <div className="mt-8 max-w-md space-y-2.5 text-[13.5px] leading-relaxed text-espresso/65">
        <p>
          We will confirm your order, sizes and delivery details personally via phone, email or
          WhatsApp before dispatch.
        </p>
        {order && (
          <p>
            Keep your order number to{" "}
            <Link href="/account" className="underline decoration-gold underline-offset-2 hover:text-gold">
              track this order
            </Link>{" "}
            anytime.
          </p>
        )}
        <p className="text-taupe">
          Note: this confirmation is not a payment receipt. If you chose bank transfer, our team
          will share the account details with you.
        </p>
      </div>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link href="/shop" className="btn-hq-primary">
          Continue Shopping
        </Link>
        {isWhatsAppConfigured() && (
          <a
            href={waGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hq-outline"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Ask About My Order
          </a>
        )}
      </div>
    </div>
  );
}
