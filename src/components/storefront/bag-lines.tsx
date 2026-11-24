"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart, type CartItem } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/site";
import { photoPosition } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export function Quantity({
  value,
  max,
  onChange,
  label,
  large = false,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  large?: boolean;
}) {
  const btn = cn(
    "inline-flex items-center justify-center transition-colors hover:bg-shell disabled:opacity-30",
    large ? "h-[3.15rem] w-12" : "size-11"
  );
  return (
    <div className="inline-flex items-center border border-sand" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="size-3.5" strokeWidth={1.6} />
      </button>
      <span className="price min-w-8 text-center text-[0.9375rem] font-medium" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" strokeWidth={1.6} />
      </button>
    </div>
  );
}

export function itemOptions(item: Pick<CartItem, "color" | "size">): string {
  return [item.color, item.size && `Size ${item.size}`].filter(Boolean).join(", ");
}

/** Editable bag lines, shared by the bag drawer and the bag page. */
export function BagLines({ large = false, onNavigate }: { large?: boolean; onNavigate?: () => void }) {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  return (
    <ul className="divide-y divide-sand">
      {items.map((item) => (
        <li key={item.key} className={cn("flex", large ? "gap-5 py-7 sm:gap-8" : "gap-4 py-5")}>
          <Link
            href={`/product/${item.slug}${item.color ? `?colour=${encodeURIComponent(item.color)}` : ""}`}
            onClick={onNavigate}
            className={cn("photo block shrink-0 self-start", large ? "aspect-[3/4] w-28 sm:w-40" : "aspect-[3/4] w-24")}
          >
            {item.image && (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes={large ? "160px" : "96px"}
                style={{ objectPosition: photoPosition(item.image) }}
              />
            )}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/product/${item.slug}${item.color ? `?colour=${encodeURIComponent(item.color)}` : ""}`}
                onClick={onNavigate}
                className={cn(large ? "t-sub" : "text-[1rem] font-medium leading-snug")}
              >
                {item.name}
              </Link>
              <p className="price shrink-0 font-medium">{formatINR(item.price * item.quantity)}</p>
            </div>
            <p className="mt-1 text-[0.9375rem] text-ink-soft">{itemOptions(item)}</p>
            {item.quantity > 1 && (
              <p className="price mt-0.5 text-sm text-ink-soft">{formatINR(item.price)} each</p>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4">
              <Quantity
                value={item.quantity}
                max={Math.min(10, item.maxStock)}
                onChange={(n) => setQuantity(item.key, n)}
                label={`Quantity of ${item.name}`}
              />
              <button
                type="button"
                onClick={() => remove(item.key)}
                className="link py-2 text-sm text-ink-soft hover:text-ink"
                aria-label={`Remove ${item.name}, ${itemOptions(item)}`}
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** How far the bag is from free shipping, using the store's real threshold. */
export function ShippingMeter({ subtotal }: { subtotal: number }) {
  const gap = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div>
      <p className="text-[0.9375rem]">
        {gap > 0 ? (
          <>
            <span className="price font-medium">{formatINR(gap)}</span> away from free shipping
          </>
        ) : (
          "Your order ships free"
        )}
      </p>
      <div className="mt-2.5 h-[3px] bg-sand" aria-hidden="true">
        <div className="h-full bg-olive transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
