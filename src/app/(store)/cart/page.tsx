"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { shippingFor, FREE_SHIPPING_THRESHOLD } from "@/lib/site";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  return (
    <div className="container-hq py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-taupe">
        Home <span className="mx-1.5 text-gold">/</span> Shopping Bag
      </nav>
      <h1 className="display-1 mt-3 text-espresso">Shopping Bag</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-taupe" strokeWidth={1} />
          <p className="font-display text-3xl text-espresso">Your bag is empty</p>
          <p className="max-w-sm text-sm leading-relaxed text-taupe">
            Fill it with pieces that feel like you — abayas, maxis and considered tailoring.
          </p>
          <Link href="/shop" className="btn-hq-primary mt-2">
            Explore The Collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {/* Items */}
          <div>
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <li key={item.key} className="flex gap-5 py-6">
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative h-36 w-28 shrink-0 overflow-hidden bg-cream"
                  >
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-display text-xl text-espresso hover:text-gold"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-taupe">
                          {item.color} · Size {item.size}
                        </p>
                        <p className="mt-1.5 text-[13px] text-espresso/70">
                          {formatINR(item.price)} each
                        </p>
                      </div>
                      <button
                        onClick={() => remove(item.key)}
                        className="inline-flex h-9 w-9 items-center justify-center text-taupe transition-colors hover:text-espresso"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="inline-flex items-center border border-border">
                        <button
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[15px] font-semibold text-espresso">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="link-underline mt-6 inline-block text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Summary */}
          <aside className="h-fit border border-border bg-cream/40 p-7 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-espresso">Order Summary</h2>
            <dl className="mt-6 space-y-3 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-espresso/70">Subtotal</dt>
                <dd className="font-medium text-espresso">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-espresso/70">Shipping (estimated)</dt>
                <dd className="font-medium text-espresso">
                  {shipping === 0 ? "Complimentary" : formatINR(shipping)}
                </dd>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-[12px] text-taupe">
                  Add {formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for complimentary shipping.
                </p>
              )}
              <div className="flex justify-between border-t border-border pt-4 text-[16px]">
                <dt className="font-semibold text-espresso">Total</dt>
                <dd className="font-semibold text-espresso">{formatINR(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn-hq-primary mt-7 w-full">
              Proceed to Checkout
            </Link>
            <p className="mt-4 text-center text-[11.5px] leading-relaxed text-taupe">
              Secure checkout · Cash on Delivery &amp; Bank Transfer available · Final shipping
              confirmed personally before dispatch
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
