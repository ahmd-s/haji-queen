"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { shippingFor } from "@/lib/site";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const closeDrawer = useCart((s) => s.closeDrawer);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const freeGap = Math.max(0, 4999 - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-espresso/40"
            onClick={closeDrawer}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col bg-ivory shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-xl text-espresso">
                Shopping Bag
                <span className="ml-2 text-sm text-taupe">
                  ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              </h2>
              <button
                onClick={closeDrawer}
                className="inline-flex h-10 w-10 items-center justify-center text-espresso hover:text-gold"
                aria-label="Close bag"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag className="h-10 w-10 text-taupe" strokeWidth={1} />
                <p className="font-display text-2xl text-espresso">Your bag is empty</p>
                <p className="max-w-[26ch] text-sm text-taupe">
                  Beautiful things are waiting. Explore the collection.
                </p>
                <Link href="/shop" onClick={closeDrawer} className="btn-hq-primary mt-2">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                {freeGap > 0 ? (
                  <div className="border-b border-border bg-cream/60 px-6 py-3 text-center text-[12px] tracking-wide text-espresso/80">
                    Add <span className="font-semibold text-gold">{formatINR(freeGap)}</span> more for
                    complimentary shipping
                  </div>
                ) : (
                  <div className="border-b border-border bg-cream/60 px-6 py-3 text-center text-[12px] tracking-wide text-espresso/80">
                    Complimentary shipping unlocked
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-6">
                  <ul className="divide-y divide-border">
                    {items.map((item) => (
                      <li key={item.key} className="flex gap-4 py-5">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeDrawer}
                          className="relative h-28 w-22 shrink-0 overflow-hidden bg-cream"
                        >
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="88px"
                              className="object-cover"
                            />
                          )}
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/product/${item.slug}`}
                                onClick={closeDrawer}
                                className="font-display text-[17px] leading-tight text-espresso hover:text-gold"
                              >
                                {item.name}
                              </Link>
                              <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-taupe">
                                {item.color || "As shown"} · Size {item.size}
                              </p>
                            </div>
                            <button
                              onClick={() => remove(item.key)}
                              className="text-taupe transition-colors hover:text-espresso"
                              aria-label={`Remove ${item.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="inline-flex items-center border border-border">
                              <button
                                onClick={() => setQuantity(item.key, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => setQuantity(item.key, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                                disabled={item.quantity >= item.maxStock}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-espresso">
                              {formatINR(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border px-6 py-5">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-espresso/80">
                      <span>Subtotal</span>
                      <span className="font-semibold text-espresso">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-espresso/80">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Complimentary" : formatINR(shipping)}</span>
                    </div>
                  </div>
                  <Link href="/checkout" onClick={closeDrawer} className="btn-hq-primary mt-4 w-full">
                    Proceed to Checkout
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <Link
                      href="/cart"
                      onClick={closeDrawer}
                      className="link-underline text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso"
                    >
                      View Bag
                    </Link>
                    <button
                      onClick={closeDrawer}
                      className="link-underline text-[12px] font-semibold uppercase tracking-[0.18em] text-taupe hover:text-espresso"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
