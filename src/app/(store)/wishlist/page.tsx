"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/store/wishlist-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatINR } from "@/lib/money";
import { hasPrice, photoPosition, statusLabel } from "@/lib/storefront";
import type { ProductDTO } from "@/lib/types";

export default function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const hydrated = useHydrated();
  // Saved items keep the price they had when saved; show today's instead.
  const [live, setLive] = useState<Map<string, ProductDTO> | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/products?limit=60", { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { products: ProductDTO[] }) => setLive(new Map(d.products.map((p) => [p.id, p]))))
      .catch(() => undefined);
    return () => abort.abort();
  }, []);

  return (
    <div className="wrap min-h-[64vh] pb-[var(--section)] pt-10 md:pt-16">
      <h1 className="t-title">Wishlist</h1>

      {!hydrated ? null : items.length === 0 ? (
        <>
          <p className="t-body mt-5">Nothing saved yet. Tap the heart on any piece and it will be kept here, on this device.</p>
          <Link href="/new-arrivals" className="btn btn-solid mt-8">
            See new arrivals
          </Link>
        </>
      ) : (
        <ul className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {items.map((item) => {
            const p = live?.get(item.productId);
            const price = p ? (hasPrice(p) ? p.price : 0) : item.price;
            return (
              <li key={item.productId} className="group flex flex-col">
                <Link href={`/product/${item.slug}`} className="photo photo-hover block aspect-[3/4]" tabIndex={-1} aria-hidden="true">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 50vw, 25vw"
                      style={{ objectPosition: photoPosition(item.image) }}
                    />
                  )}
                </Link>
                <h2 className="mt-3.5 font-medium leading-snug">
                  <Link href={`/product/${item.slug}`} className="hover:text-olive">
                    {item.name}
                  </Link>
                </h2>
                <p className="price mt-0.5">{price > 0 ? formatINR(price) : "Price on request"}</p>
                {p && <p className="mt-0.5 text-sm text-ink-soft">{statusLabel(p)}</p>}
                <div className="mt-auto pt-4">
                  <Link href={`/product/${item.slug}`} className="btn btn-line w-full !px-3">
                    {p && !p.purchasable ? "View and enquire" : "Choose size"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="mt-1 min-h-11 w-full text-[0.9375rem] text-ink-soft hover:text-ink"
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
