"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { SizeGuide, isLengthSized } from "@/components/product/size-guide";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Quantity } from "@/components/storefront/bag-lines";
import { isVariantPurchasable, maxVariantQuantity, variantUnavailableReason } from "@/lib/availability";
import { formatINR } from "@/lib/money";
import { pixelEvents } from "@/lib/pixel";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, SITE_URL } from "@/lib/site";
import {
  categoryLabel,
  colourPhotos,
  displayBadge,
  enquiryNote,
  hasPrice,
  photoPosition,
  statusLabel,
  swatchBackground,
} from "@/lib/storefront";
import { isWhatsAppConfigured, waProductLink } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

export function ProductDetail({ product, initialColour }: { product: ProductDTO; initialColour?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);

  const [colour, setColour] = useState(() => {
    const open = product.colors.filter((c) => c.available !== false);
    return (open.find((c) => c.name === initialColour) ?? open[0] ?? product.colors[0])?.name ?? "";
  });
  const [size, setSize] = useState(() =>
    product.sizes.length === 1 && isVariantPurchasable(product, product.sizes[0], colour) ? product.sizes[0] : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const sizeRef = useRef<HTMLFieldSetElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pixelEvents.viewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category.name,
    });
  }, [product.id]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const activeColour = product.colors.find((c) => c.name === colour);
  const photos = colourPhotos(product, activeColour);
  const variantColour = product.colors.length ? colour : "";
  const variant = product.variants.find((v) => v.size === size && v.color === variantColour);
  const variantOk = isVariantPurchasable(product, size, variantColour);
  const maxQty = size ? Math.max(1, Math.min(10, maxVariantQuantity(product, size, variantColour))) : 1;
  const lengthSized = isLengthSized(product.sizes);
  const badge = displayBadge(product);

  const chooseColour = (name: string) => {
    setColour(name);
    setQuantity(1);
    setError(null);
    if (size && !isVariantPurchasable(product, size, name)) setSize("");
    window.history.replaceState(null, "", `${window.location.pathname}?colour=${encodeURIComponent(name)}`);
  };

  const addToBag = (checkout = false) => {
    if (!size) {
      setError(lengthSized ? "Choose a length to continue" : "Choose a size to continue");
      sizeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      sizeRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    if (!variantOk || !variant) {
      setError(variantUnavailableReason(product, size, variantColour) ?? "This option is not available");
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: photos[0] ?? "",
      price: product.price,
      size,
      color: variantColour,
      quantity,
      maxStock: product.trackStock ? variant.stock : 10,
    });
    pixelEvents.addToCart({ id: product.id, name: product.name, price: product.price, quantity });
    if (checkout) router.push("/checkout");
  };

  const contactHref = useMemo(() => {
    const params = new URLSearchParams({ product: product.slug });
    if (colour) params.set("colour", colour);
    if (size) params.set("size", size);
    return `/contact?${params.toString()}`;
  }, [product.slug, colour, size]);

  const whatsappHref = isWhatsAppConfigured()
    ? waProductLink(
        product.name,
        `${SITE_URL}/product/${product.slug}`,
        [colour, size && `Size ${size}`].filter(Boolean).join(", ") || undefined
      )
    : null;

  const price = hasPrice(product) ? formatINR(product.price) : null;

  return (
    <>
      <div className="wrap pb-[var(--section)] pt-4 md:pt-6">
        <nav aria-label="Breadcrumb" className="hidden pb-5 text-sm text-ink-soft md:block">
          <ol className="flex flex-wrap gap-x-2">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
              <span aria-hidden="true" className="ml-2">
                /
              </span>
            </li>
            <li>
              <Link href={`/category/${product.category.slug}`} className="hover:text-ink">
                {categoryLabel(product.category)}
              </Link>
              <span aria-hidden="true" className="ml-2">
                /
              </span>
            </li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-x-[clamp(2rem,5vw,5rem)] gap-y-7 md:grid-cols-[minmax(0,1.2fr)_minmax(20rem,1fr)]">
          {/* Photography */}
          <div className="-mt-4 min-w-0 self-start md:sticky md:top-[5.75rem] md:mt-0">
            {photos.length > 0 ? (
              <ProductGallery key={colour} images={photos} name={product.name} colour={colour || undefined} />
            ) : (
              <div className="flex aspect-[4/5] flex-col justify-end bg-shell p-8 md:p-12">
                <p className="t-head max-w-[14ch]">Photographs to follow.</p>
                <p className="mt-3 max-w-[38ch] text-ink-soft">
                  Ask us about this piece and we will send you pictures directly.
                </p>
              </div>
            )}
          </div>

          {/* Information */}
          <div className="min-w-0 md:max-w-[34rem]">
            {badge && <p className="mb-2 text-[0.9375rem] text-olive">{badge}</p>}
            <h1 className="t-title !text-[clamp(2.1rem,3.3vw,3.1rem)]">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="price text-[1.375rem] font-medium">
                {price ?? "Price on request"}
                {price && product.compareAtPrice && product.compareAtPrice > product.price && (
                  <s className="ml-3 text-[1.0625rem] font-normal text-ink-soft">{formatINR(product.compareAtPrice)}</s>
                )}
              </p>
              <p className="flex items-center gap-2 text-[0.9375rem] text-olive">
                <span className="size-2 rounded-full bg-olive" aria-hidden="true" />
                {statusLabel(product)}
              </p>
            </div>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-ink-soft">{product.description}</p>

            {/* Colour */}
            {product.colors.length > 0 && (
              <fieldset className="mt-8">
                <legend className="text-[0.9375rem]">
                  <span className="font-medium">Colour</span>
                  <span className="text-ink-soft">: {colour}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const selected = c.name === colour;
                    const unavailable = c.available === false;
                    const thumb = c.images?.[0];
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => chooseColour(c.name)}
                        disabled={unavailable}
                        aria-pressed={selected}
                        aria-label={unavailable ? `${c.name}, unavailable` : c.name}
                        title={c.name}
                        className={cn(
                          "relative overflow-hidden transition-shadow disabled:opacity-35",
                          thumb ? "aspect-[3/4] w-[3.6rem] bg-shell" : "size-11 rounded-full",
                          selected
                            ? "shadow-[0_0_0_2px_var(--color-paper),0_0_0_3.5px_var(--color-ink)]"
                            : "shadow-[0_0_0_1px_rgb(42_32_26/.14)] hover:shadow-[0_0_0_1px_var(--color-ink)]"
                        )}
                        style={thumb ? undefined : { background: swatchBackground(c) }}
                      >
                        {thumb && (
                          <Image src={thumb} alt="" fill sizes="58px" className="object-cover" style={{ objectPosition: photoPosition(thumb) }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Size */}
            {product.sizes.length > 0 && (
              <fieldset ref={sizeRef} className="mt-8 scroll-mt-32" aria-describedby={error ? "size-error" : undefined}>
                <legend className="sr-only">{lengthSized ? "Length" : "Size"}</legend>
                <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                  <p>
                    <span className="font-medium">{lengthSized ? "Length" : "Size"}</span>
                    {size && <span className="text-ink-soft">: {size}</span>}
                  </p>
                  <button type="button" onClick={() => setGuideOpen(true)} className="link py-1">
                    Size guide
                  </button>
                </div>
                <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2">
                  {product.sizes.map((s) => {
                    const ok = isVariantPurchasable(product, s, variantColour);
                    return (
                      <label
                        key={s}
                        className={cn(
                          "relative flex h-[3.15rem] items-center justify-center border text-[0.9688rem] transition-colors",
                          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-olive",
                          !ok && "!cursor-not-allowed border-sand text-ink-soft/60 line-through",
                          ok && size === s && "border-ink bg-ink text-paper",
                          ok && size !== s && "border-[#cbbba6] hover:border-ink",
                          ok && error && !size && "border-clay"
                        )}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={s}
                          checked={size === s}
                          disabled={!ok}
                          onChange={() => {
                            setSize(s);
                            setQuantity(1);
                            setError(null);
                          }}
                          className="sr-only"
                          aria-label={ok ? s : `${s}, unavailable in ${colour}`}
                        />
                        {s}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {product.sizeNotes && <p className="mt-3 text-[0.9375rem] text-ink-soft">{product.sizeNotes}</p>}
            {product.sizes.length === 0 && (
              <button type="button" onClick={() => setGuideOpen(true)} className="link mt-3 py-1 text-[0.9375rem]">
                How sizing works
              </button>
            )}
            {error && (
              <p id="size-error" role="alert" className="field-error">
                {error}
              </p>
            )}

            {/* Purchase */}
            <div ref={ctaRef} className="mt-7">
              {product.purchasable ? (
                <>
                  <div className="flex gap-2.5">
                    <Quantity value={quantity} max={maxQty} onChange={(n) => setQuantity(Math.max(1, Math.min(maxQty, n)))} label="Quantity" large />
                    <button type="button" onClick={() => addToBag()} className="btn btn-solid flex-1">
                      Add to bag
                    </button>
                  </div>
                  <button type="button" onClick={() => addToBag(true)} className="btn btn-line mt-2.5 w-full">
                    Buy now
                  </button>
                  {product.trackStock && variant && variant.stock > 0 && variant.stock <= 3 && (
                    <p className="mt-3 text-[0.9375rem] text-ink-soft">
                      {variant.stock === 1 ? "One piece" : `${variant.stock} pieces`} in stock in this size.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-4 border-l-2 border-olive pl-4 text-[0.9688rem]">{enquiryNote(product)}</p>
                  <Link href={contactHref} className="btn btn-solid w-full">
                    Enquire about this piece
                  </Link>
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-1 text-[0.9375rem]">
                <WishlistButton product={product} image={photos[0]} className="inline-flex min-h-11 items-center gap-2.5 hover:text-olive">
                  {(saved) => <span>{saved ? "Saved to wishlist" : "Save to wishlist"}</span>}
                </WishlistButton>
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="link py-2">
                    Ask on WhatsApp
                  </a>
                ) : (
                  product.purchasable && (
                    <Link href={contactHref} className="link py-2">
                      Ask a question
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Answers customers look for before buying */}
            <dl className="mt-6 grid gap-x-6 gap-y-4 border-y border-sand py-5 text-[0.9375rem] sm:grid-cols-3">
              <div>
                <dt className="font-medium">Shipping</dt>
                <dd className="price mt-0.5 text-ink-soft">
                  {formatINR(SHIPPING_FEE)}, free above {formatINR(FREE_SHIPPING_THRESHOLD)}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Payment</dt>
                <dd className="mt-0.5 text-ink-soft">Cash on delivery or bank transfer</dd>
              </div>
              <div>
                <dt className="font-medium">Before dispatch</dt>
                <dd className="mt-0.5 text-ink-soft">We contact you to confirm your order</dd>
              </div>
            </dl>

            <div className="divide-y divide-sand border-b border-sand">
              {(product.fabricDetails || product.careInstructions) && (
                <details className="fold" open>
                  <summary>{product.careInstructions ? "Fabric and care" : "Fabric"}</summary>
                  <div className="space-y-2 pb-5 text-ink-soft">
                    {product.fabricDetails && <p>{product.fabricDetails}</p>}
                    {product.careInstructions && <p>{product.careInstructions}</p>}
                  </div>
                </details>
              )}
              <details className="fold">
                <summary>Size and fit</summary>
                <div className="space-y-2 pb-5 text-ink-soft">
                  {product.sizeNotes && <p>{product.sizeNotes}</p>}
                  <p>
                    {lengthSized
                      ? "Abaya sizes are garment lengths. "
                      : product.sizes.length
                        ? "Between two sizes? Ask us before you order. "
                        : "We confirm sizing with you personally. "}
                    <button type="button" onClick={() => setGuideOpen(true)} className="link text-ink">
                      Open the size guide
                    </button>
                  </p>
                  <p>
                    Need something made to your measure?{" "}
                    <Link href="/custom-measurements" className="link text-ink">
                      Send us your measurements
                    </Link>
                  </p>
                </div>
              </details>
              <details className="fold">
                <summary>Shipping</summary>
                <div className="space-y-2 pb-5 text-ink-soft">
                  <p className="price">
                    {formatINR(SHIPPING_FEE)} per order, free on orders of {formatINR(FREE_SHIPPING_THRESHOLD)} and above.
                    Dispatch time depends on the piece and where you live; we share it when we confirm your order.
                  </p>
                  <p>
                    <Link href="/shipping-policy" className="link text-ink">
                      Read the shipping policy
                    </Link>
                  </p>
                </div>
              </details>
              <details className="fold">
                <summary>Returns and exchanges</summary>
                <div className="space-y-2 pb-5 text-ink-soft">
                  <p>
                    Size exchanges are supported on unworn, unwashed pieces with their original tags. Made-to-measure and
                    altered pieces are exchanged only for manufacturing defects.
                  </p>
                  <p>
                    <Link href="/returns-policy" className="link text-ink">
                      Read the returns and exchange policy
                    </Link>
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile purchase bar, only once the main button has scrolled away */}
      <div
        data-buybar
        inert={ctaVisible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-paper px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 md:hidden",
          ctaVisible ? "translate-y-full" : "translate-y-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-medium leading-tight">{product.name}</p>
            <p className="price mt-0.5 truncate text-sm text-ink-soft">
              {[price ?? "Price on request", colour, size && (lengthSized ? `Length ${size}` : `Size ${size}`)]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          {product.purchasable ? (
            <button type="button" onClick={() => addToBag()} className="btn btn-solid !min-h-12 shrink-0 !px-6">
              {size ? "Add to bag" : lengthSized ? "Choose length" : "Choose size"}
            </button>
          ) : (
            <Link href={contactHref} className="btn btn-solid !min-h-12 shrink-0 !px-6">
              Enquire
            </Link>
          )}
        </div>
      </div>

      <SizeGuide product={product} open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
