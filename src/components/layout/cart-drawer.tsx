"use client";

import Link from "next/link";
import { Sheet, SheetHeader } from "@/components/storefront/sheet";
import { BagLines, ShippingMeter } from "@/components/storefront/bag-lines";
import { useCart, cartCount, cartSubtotal } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { shippingFor } from "@/lib/site";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.closeDrawer);
  const items = useCart((s) => s.items);
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  return (
    <Sheet open={isOpen} onClose={close} label="Shopping bag">
      <SheetHeader
        title={items.length ? `Your bag (${cartCount(items)})` : "Your bag"}
        onClose={close}
        closeLabel="Close bag"
      />
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-5 px-6 pb-24">
          <p className="t-head">Nothing here yet.</p>
          <p className="text-ink-soft">Pieces you add will wait for you in this bag.</p>
          <Link href="/new-arrivals" onClick={close} className="btn btn-solid self-start">
            See new arrivals
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            <div className="border-b border-sand py-4">
              <ShippingMeter subtotal={subtotal} />
            </div>
            <BagLines onNavigate={close} />
          </div>
          <div className="shrink-0 border-t border-sand px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <dl className="space-y-1.5 text-[0.9375rem]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="price">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="price">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between pt-1.5 text-[1.0625rem] font-medium">
                <dt>Total</dt>
                <dd className="price">{formatINR(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Link href="/checkout" onClick={close} className="btn btn-solid mt-4 w-full">
              Checkout
            </Link>
            <Link href="/cart" onClick={close} className="btn btn-line mt-2.5 w-full">
              View bag
            </Link>
          </div>
        </>
      )}
    </Sheet>
  );
}
