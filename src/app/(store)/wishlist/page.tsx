"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useWishlist } from "@/store/wishlist-store";
import { useCart } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ProductDTO } from "@/lib/types";

export default function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const addToCart = useCart((s) => s.add);
  const hydrated = useHydrated();

  const moveToBag = async (item: (typeof items)[number]) => {
    // Fetch current product data to honour size/colour/stock rules
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(item.name)}&limit=10`);
      const data = await res.json();
      const product = (data.products as ProductDTO[]).find((p) => p.id === item.productId);
      if (!product || product.stock <= 0) {
        remove(item.productId);
        return;
      }
      addToCart({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? item.image,
        price: product.price,
        size: product.sizes[0] ?? "M",
        color: product.colors[0]?.name ?? "As shown",
        quantity: 1,
        maxStock: Math.max(product.stock, 1),
      });
    } catch {
      // network issue — leave wishlist untouched
    }
  };

  return (
    <div className="container-hq py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-taupe">
        Home <span className="mx-1.5 text-gold">/</span> Wishlist
      </nav>
      <h1 className="display-1 mt-3 text-espresso">Wishlist</h1>
      <p className="mt-3 max-w-lg text-[14px] text-espresso/65">
        Pieces you are considering. They stay here on this device until you are ready.
      </p>

      {!hydrated ? null : items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <Heart className="h-12 w-12 text-taupe" strokeWidth={1} />
          <p className="font-display text-3xl text-espresso">Nothing saved yet</p>
          <p className="max-w-sm text-sm text-taupe">
            Tap the heart on any piece you love and it will wait for you here.
          </p>
          <Link href="/shop" className="btn-hq-primary mt-2">
            Discover The Collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.productId} className="group relative">
              <Link href={`/product/${item.slug}`}>
                <div className="img-zoom relative aspect-[3/4] w-full bg-cream">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="25vw" className="object-cover" />
                  )}
                </div>
                <h3 className="mt-3 font-display text-[18px] text-espresso group-hover:text-gold">
                  {item.name}
                </h3>
                <p className="mt-0.5 text-[13.5px] font-semibold text-espresso/80">
                  {formatINR(item.price)}
                </p>
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => moveToBag(item)}
                  className="btn-hq-outline flex-1 !py-2.5 !text-[11px]"
                >
                  <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Move to Bag
                </button>
                <button
                  onClick={() => remove(item.productId)}
                  className="inline-flex h-10 w-10 items-center justify-center border border-border text-taupe hover:text-espresso"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
