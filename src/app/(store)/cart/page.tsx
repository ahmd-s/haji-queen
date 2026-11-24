"use client";

import Link from "next/link";
import { BagLines, ShippingMeter } from "@/components/storefront/bag-lines";
import { useCart, cartCount, cartSubtotal } from "@/store/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatINR } from "@/lib/money";
import { shippingFor } from "@/lib/site";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  return (
    <div className="wrap pb-[var(--section)] pt-10 md:pt-16">
      <h1 className="t-title">Your bag</h1>

      {!hydrated ? (
        <div className="min-h-[50vh]" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="min-h-[46vh] pt-6">
          <p className="t-body">There is nothing in it yet. Pieces you add will wait for you here.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/new-arrivals" className="btn btn-solid">
              See new arrivals
            </Link>
            <Link href="/wishlist" className="btn btn-line">
              Open wishlist
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-x-[clamp(2.5rem,6vw,6rem)] gap-y-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-fit border-y border-sand">
            <BagLines large />
          </div>

          <aside className="h-fit bg-shell p-6 sm:p-9 lg:sticky lg:top-28" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="t-sub">
              Summary
            </h2>
            <div className="mt-5">
              <ShippingMeter subtotal={subtotal} />
            </div>
            <dl className="mt-6 space-y-2.5">
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  {cartCount(items)} {cartCount(items) === 1 ? "piece" : "pieces"}
                </dt>
                <dd className="price">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="price">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-sand pt-4 text-[1.1875rem] font-medium">
                <dt>Total</dt>
                <dd className="price">{formatINR(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn-solid mt-7 w-full">
              Checkout
            </Link>
            <p className="mt-5 text-[0.9375rem] text-ink-soft">
              Pay by cash on delivery or bank transfer. We contact you to confirm your order before it is dispatched.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-5 text-[0.9375rem]">
              <Link href="/shipping-policy" className="link py-1">
                Shipping
              </Link>
              <Link href="/returns-policy" className="link py-1">
                Returns and exchanges
              </Link>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
