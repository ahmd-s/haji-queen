"use client";

import { Heart } from "lucide-react";
import { notify } from "@/components/storefront/notice";
import { useWishlist } from "@/store/wishlist-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

export function WishlistButton({
  product,
  image,
  className,
  children,
}: {
  product: ProductDTO;
  image?: string;
  className?: string;
  children?: (saved: boolean) => React.ReactNode;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const inList = useWishlist((s) => s.items.some((i) => i.productId === product.id));
  const saved = useHydrated() && inList;

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        const added = toggle({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: image ?? product.images[0] ?? "",
          price: product.price,
        });
        if (added) notify(`${product.name} saved`, { href: "/wishlist", label: "View wishlist" });
        else notify(`${product.name} removed from wishlist`);
      }}
    >
      <Heart
        className={cn("size-[1.15rem] transition-transform duration-300", saved && "scale-110 fill-current")}
        strokeWidth={1.4}
      />
      {children?.(saved)}
    </button>
  );
}
