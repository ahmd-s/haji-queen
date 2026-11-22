"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/money";
import { useWishlist } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductDTO;
  priority?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState(false);
  const toggle = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => s.items.some((i) => i.productId === product.id));

  const firstColour = product.colors[0];
  const gallery = firstColour?.images?.length ? firstColour.images : product.images;
  const img = hover && gallery[1] ? gallery[1] : gallery[0];
  const hasPhoto = Boolean(img);

  const onWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const added = toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      price: product.price,
    });
    toast({
      title: added ? "Added to wishlist" : "Removed from wishlist",
      description: product.name,
    });
  };

  return (
    <article
      className={cn("group relative", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/product/${product.slug}`} className="block" aria-label={product.name}>
        <div className="img-zoom relative aspect-[3/4] w-full bg-cream">
          {hasPhoto ? (
            <Image
              src={img}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <span className="h-px w-7 bg-gold" />
              <p className="font-display text-[15px] text-espresso">Photographs coming soon</p>
            </div>
          )}

          {product.badge && (
            <span className="absolute left-3 top-3 bg-ivory/95 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-espresso">
              {product.badge}
            </span>
          )}
          {!product.priceConfirmed && (
            <span className="absolute bottom-3 left-3 bg-ivory/95 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
              {hasPhoto ? "Enquiry Only" : "Coming Soon"}
            </span>
          )}
          {product.priceConfirmed && !product.purchasable && product.inStock && (
            <span className="absolute bottom-3 left-3 bg-ivory/95 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
              Enquiry Only
            </span>
          )}
          {product.priceConfirmed && !product.inStock && (
            <span className="absolute left-3 top-3 bg-espresso/90 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ivory">
              Sold Out
            </span>
          )}
        </div>

        <div className="pt-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-taupe">
            {product.category.name}
          </p>
          <h3 className="mt-1 font-display text-[19px] leading-snug text-espresso transition-colors group-hover:text-gold">
            {product.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            {product.priceConfirmed && product.price > 0 ? (
              <>
                <p className="text-[14px] font-semibold text-espresso">{formatINR(product.price)}</p>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <p className="text-[12.5px] text-taupe line-through">
                    {formatINR(product.compareAtPrice)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] font-semibold text-gold-deep">Price Pending</p>
            )}
          </div>
          {product.colors.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5" aria-label="Available colours">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3 w-3 rounded-full border border-espresso/15"
                  style={{
                    background: c.hex2
                      ? `linear-gradient(135deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)`
                      : c.hex,
                  }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10.5px] text-taupe">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={onWishlist}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={cn(
          "absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 shadow-sm transition-all duration-300 hover:scale-110",
          wishlisted ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
        )}
      >
        <Heart
          className={cn("h-[15px] w-[15px]", wishlisted ? "fill-gold text-gold" : "text-espresso")}
          strokeWidth={1.6}
        />
      </button>
    </article>
  );
}
