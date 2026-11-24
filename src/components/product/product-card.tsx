"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/product/wishlist-button";
import { formatINR } from "@/lib/money";
import {
  colourFamilies,
  colourPhotos,
  displayBadge,
  hasPrice,
  isSoldOut,
  photoPosition,
  statusLabel,
  swatchBackground,
} from "@/lib/storefront";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

const MAX_SWATCHES = 5;

export function ProductCard({
  product,
  priority = false,
  feature = false,
  families,
  className,
  sizes = "(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw",
}: {
  product: ProductDTO;
  priority?: boolean;
  /** Fills a larger grid cell. */
  feature?: boolean;
  /** Active colour filter: the card opens on a matching colour. */
  families?: string[];
  className?: string;
  sizes?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const matched = families?.length
    ? product.colors.find((c) => colourFamilies(c).some((f) => families.includes(f)))
    : undefined;
  const colour = product.colors.find((c) => c.name === picked) ?? matched ?? product.colors[0];
  const photos = colourPhotos(product, colour);
  const [main, alternate] = photos;
  const linked = picked ?? matched?.name;
  const href = `/product/${product.slug}${linked ? `?colour=${encodeURIComponent(linked)}` : ""}`;
  const badge = isSoldOut(product) ? "Sold out" : displayBadge(product);
  const swatches = product.colors.filter((c) => c.images?.length);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className={cn("photo photo-hover", feature ? "aspect-[4/5] md:aspect-auto md:min-h-0 md:flex-1" : "aspect-[3/4]")}>
        <Link href={href} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
          {main ? (
            <>
              <Image
                key={main}
                src={main}
                alt=""
                fill
                sizes={sizes}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : undefined}
                quality={feature ? 85 : 75}
                className={picked ? "fade-in" : undefined}
                style={{ objectPosition: photoPosition(main) }}
              />
              {alternate && (
                <Image
                  src={alternate}
                  alt=""
                  fill
                  sizes={sizes}
                  className="hidden opacity-0 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:opacity-100"
                  style={{ objectPosition: photoPosition(alternate) }}
                />
              )}
            </>
          ) : (
            <span className="absolute inset-0 flex items-end p-4 sm:p-6">
              <span className="t-sub text-ink-soft">Photographs to follow</span>
            </span>
          )}
        </Link>
        {badge && (
          <span className="absolute left-0 top-3 bg-paper px-2.5 py-1 text-[0.8125rem] leading-tight">{badge}</span>
        )}
        <WishlistButton
          product={product}
          image={main}
          className="absolute right-2.5 top-2.5 inline-flex size-9 items-center justify-center rounded-full bg-paper/70 text-ink transition-colors before:absolute before:-inset-1.5 hover:bg-paper"
        />
      </div>

      <div className="pt-3.5">
        <div className="flex flex-col gap-x-4 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className={cn("font-medium leading-snug", feature ? "text-[1.125rem]" : "text-[0.9688rem] sm:text-[1rem]")}>
            <Link href={href} className="hover:text-olive">
              {product.name}
            </Link>
          </h3>
          <p className="price shrink-0 text-[0.9688rem] sm:text-[1rem]">
            {hasPrice(product) ? (
              <>
                {formatINR(product.price)}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <s className="ml-2 text-ink-soft">{formatINR(product.compareAtPrice)}</s>
                )}
              </>
            ) : (
              "Price on request"
            )}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{statusLabel(product)}</p>
        {swatches.length > 1 && (
          <div className="-ml-1 mt-1.5 flex flex-wrap items-center" role="group" aria-label={`Colours of ${product.name}`}>
            {swatches.slice(0, MAX_SWATCHES).map((c) => (
              <button
                key={c.name}
                type="button"
                onMouseEnter={() => setPicked(c.name)}
                onClick={() => setPicked(c.name)}
                aria-pressed={colour?.name === c.name}
                aria-label={`Show ${c.name}`}
                title={c.name}
                className="inline-flex size-7 items-center justify-center sm:size-8"
              >
                <span
                  className={cn(
                    "size-[1.05rem] rounded-full ring-1 ring-offset-2 ring-offset-paper transition-shadow",
                    colour?.name === c.name ? "ring-ink" : "ring-transparent"
                  )}
                  style={{ background: swatchBackground(c), boxShadow: colour?.name === c.name ? undefined : "0 0 0 1px rgb(42 32 26 / .14)" }}
                />
              </button>
            ))}
            {swatches.length > MAX_SWATCHES && (
              <Link href={href} className="px-1 text-sm text-ink-soft" aria-label={`${swatches.length - MAX_SWATCHES} more colours`}>
                +{swatches.length - MAX_SWATCHES}
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
