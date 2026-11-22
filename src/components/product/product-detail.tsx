"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, MessageCircle, Minus, Plus, Ruler, ShoppingBag, Zap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AVAILABILITY_LABEL,
  isVariantPurchasable,
  maxVariantQuantity,
  normaliseAvailability,
  variantUnavailableReason,
} from "@/lib/availability";
import { SizeGuideDialog } from "@/components/product/size-guide";
import { useCart } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { pixelEvents } from "@/lib/pixel";
import { formatINR } from "@/lib/money";
import { isWhatsAppConfigured, waProductLink } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ProductDTO } from "@/lib/types";

export function ProductDetail({
  product,
  enquiryEmail,
}: {
  product: ProductDTO;
  enquiryEmail?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [imageIdx, setImageIdx] = useState(0);
  const [color, setColor] = useState(
    () => product.colors.find((c) => c.available !== false)?.name ?? product.colors[0]?.name ?? ""
  );
  const [size, setSize] = useState<string>(() => (product.sizes.length === 1 ? product.sizes[0] : ""));
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const add = useCart((s) => s.add);
  const wishlistToggle = useWishlist((s) => s.toggle);
  const wishlisted = useWishlist((s) => s.items.some((i) => i.productId === product.id));

  // ViewContent — fires once per mount (deduped by pixel guard)
  useEffect(() => {
    pixelEvents.viewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category.name,
    });
  }, [product.id]);

  const activeColour = product.colors.find((c) => c.name === color);
  const galleryImages = activeColour?.images?.length ? activeColour.images : product.images;
  const hasPhotos = galleryImages.length > 0;
  const cartColor = product.colors.length ? color : "";
  const selectedVariant = product.variants.find(
    (v) => v.size === size && v.color === cartColor
  );
  const variantAvailable = isVariantPurchasable(product, size, cartColor);
  const qtyMax = size ? Math.max(1, maxVariantQuantity(product, size, cartColor)) : 1;
  const canPurchase = product.purchasable && variantAvailable;
  const purchaseNote =
    product.unavailableReason ?? variantUnavailableReason(product, size, cartColor);

  const handleAdd = (goToCheckout = false) => {
    if (!size) {
      toast({ title: "Please select a size", description: "Choose the size that fits you best." });
      return;
    }
    if (!variantAvailable || !selectedVariant) {
      toast({
        title: "This option is not available",
        description: variantUnavailableReason(product, size, cartColor) ?? undefined,
      });
      return;
    }
    setAdding(true);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: galleryImages[0] ?? "",
      price: product.price,
      size,
      color: cartColor,
      quantity,
      maxStock: product.trackStock ? selectedVariant.stock : 10,
    });
    pixelEvents.addToCart({ id: product.id, name: product.name, price: product.price, quantity });
    toast({ title: goToCheckout ? "Taking you to checkout" : "Added to your bag", description: product.name });
    setTimeout(() => {
      setAdding(false);
      if (goToCheckout) router.push("/checkout");
    }, 350);
  };

  const variantLabel = [color, size && `Size ${size}`].filter(Boolean).join(", ");

  const whatsappUrl = useMemo(() => {
    return waProductLink(product.name, `${SITE_URL}/product/${product.slug}`, variantLabel || undefined);
  }, [variantLabel, product.name, product.slug]);

  const enquiryUrl = useMemo(() => {
    if (isWhatsAppConfigured()) return whatsappUrl;
    const subject = `Enquiry: ${product.name}`;
    const body = [
      "Hello Haji Queens,",
      "",
      `I would like to know more about ${product.name}${variantLabel ? ` (${variantLabel})` : ""}.`,
      `${SITE_URL}/product/${product.slug}`,
    ].join("\n");
    if (enquiryEmail) {
      return `mailto:${enquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    return `/contact`;
  }, [whatsappUrl, enquiryEmail, product.name, product.slug, variantLabel]);

  const chooseColor = (name: string) => {
    setColor(name);
    setImageIdx(0);
    if (size && !product.variants.some((v) => v.color === name && v.size === size)) {
      setSize("");
    }
    setQuantity(1);
  };

  return (
    <div className="container-hq pb-24 pt-8 lg:pt-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-taupe">
        <a href="/" className="hover:text-espresso">
          Home
        </a>
        <span className="mx-1.5 text-gold">/</span>
        <a href={`/category/${product.category.slug}`} className="hover:text-espresso">
          {product.category.name}
        </a>
        <span className="mx-1.5 text-gold">/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* ── Gallery ── */}
        <div>
          <div className="flex gap-4">
            {/* Thumbnails (desktop) */}
            {galleryImages.length > 1 && (
              <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex">
                {galleryImages.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setImageIdx(i)}
                    className={cn(
                      "relative aspect-[3/4] w-full overflow-hidden bg-cream border transition-colors",
                      imageIdx === i ? "border-gold" : "border-transparent hover:border-border"
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-cream">
              {hasPhotos ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={imageIdx}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={galleryImages[imageIdx]}
                      alt={`${product.name} — view ${imageIdx + 1}`}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <span className="h-px w-10 bg-gold" />
                  <p className="font-display text-xl text-espresso">Photographs coming soon</p>
                  <p className="text-[12.5px] text-taupe">
                    Details and availability are being finalised. Enquire and we will share the
                    full lookbook directly.
                  </p>
                </div>
              )}
              {product.badge && (
                <span className="absolute left-4 top-4 bg-ivory/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso">
                  {product.badge}
                </span>
              )}
            </div>
          </div>
          {/* Mobile thumbnails */}
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2.5 md:hidden">
              {galleryImages.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImageIdx(i)}
                  className={cn(
                    "relative aspect-[3/4] w-16 overflow-hidden bg-cream border",
                    imageIdx === i ? "border-gold" : "border-transparent"
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="lg:pt-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-taupe">
            {product.category.name}
          </p>
          <h1 className="display-2 mt-2 text-espresso">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {product.priceConfirmed && product.price > 0 ? (
              <>
                <p className="text-2xl font-semibold text-espresso">{formatINR(product.price)}</p>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <p className="text-[15px] text-taupe line-through">{formatINR(product.compareAtPrice)}</p>
                )}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="bg-champagne px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
                    Save {formatINR(product.compareAtPrice - product.price)}
                  </span>
                )}
              </>
            ) : (
              <p className="text-xl font-semibold text-gold-deep">Price Pending</p>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe">
              {product.priceConfirmed ? AVAILABILITY_LABEL[normaliseAvailability(product.availability)] : "Enquiry only"}
            </span>
          </div>

          {/* Colour */}
          {product.colors.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso">
                Colour <span className="ml-1 font-normal normal-case tracking-normal text-taupe">— {color}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => chooseColor(c.name)}
                    disabled={c.available === false}
                    title={c.name}
                    aria-label={`Colour ${c.name}`}
                    aria-pressed={color === c.name}
                    className={cn(
                      "relative h-9 w-9 rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-40",
                      color === c.name
                        ? "border-gold ring-1 ring-gold ring-offset-2 ring-offset-ivory"
                        : "border-espresso/20 hover:border-espresso/50"
                    )}
                    style={{
                      background: c.hex2
                        ? `linear-gradient(135deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)`
                        : c.hex,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso">
                  Size {size && <span className="ml-1 font-normal normal-case tracking-normal text-taupe">— {size}</span>}
                </p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gold underline-offset-4 hover:underline"
                >
                  <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Size guide
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const optionExists = product.variants.some(
                    (v) => v.size === s && v.color === cartColor
                  );
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSize(s);
                        setQuantity(1);
                      }}
                      disabled={!optionExists}
                      aria-pressed={size === s}
                      className={cn(
                        "h-11 min-w-12 border px-3 text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:border-border/50 disabled:text-taupe/50",
                        size === s
                          ? "border-espresso bg-espresso text-ivory"
                          : "border-border text-espresso hover:border-espresso"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.sizeNotes && (
            <p className="mt-4 text-[12.5px] leading-relaxed text-espresso/65">
              <span className="font-semibold text-espresso">Measurements: </span>
              {product.sizeNotes}
            </p>
          )}

          {/* Quantity + availability */}
          <div className="mt-7 flex flex-wrap items-center gap-6">
            {product.purchasable && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso">Quantity</p>
                <div className="mt-2 inline-flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-[15px] font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(qtyMax, quantity + 1))}
                    className="flex h-11 w-11 items-center justify-center text-espresso hover:text-gold disabled:opacity-40"
                    disabled={!size || quantity >= qtyMax}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <p
              className={cn(
                "text-[12.5px]",
                product.purchasable ? "text-espresso/60" : "font-medium text-gold-deep"
              )}
            >
              {!product.purchasable
                ? "Price pending — enquiry only"
                : product.trackStock
                  ? selectedVariant && selectedVariant.stock <= 3
                    ? `Only ${selectedVariant.stock} left in your size`
                    : "In stock, ready to ship"
                  : AVAILABILITY_LABEL[normaliseAvailability(product.availability)]}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-8 space-y-3">
            {product.purchasable ? (
              <>
                <button
                  onClick={() => handleAdd(false)}
                  disabled={!canPurchase || adding}
                  className="btn-hq-primary w-full"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  {variantAvailable ? "Add to Bag" : (purchaseNote ?? "Select a size")}
                </button>
                <button
                  onClick={() => handleAdd(true)}
                  disabled={!canPurchase || adding}
                  className="btn-hq-outline w-full"
                >
                  <Zap className="h-4 w-4" strokeWidth={1.5} />
                  Buy It Now
                </button>
              </>
            ) : (
              <a
                href={enquiryUrl}
                {...(enquiryUrl.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="btn-hq-primary w-full"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                Enquire About This Piece
              </a>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const added = wishlistToggle({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: galleryImages[0] ?? "",
                    price: product.price,
                  });
                  toast({
                    title: added ? "Added to wishlist" : "Removed from wishlist",
                    description: product.name,
                  });
                }}
                className="btn-hq-outline flex-1 !border-espresso/20"
              >
                <Heart className={cn("h-4 w-4", wishlisted && "fill-gold text-gold")} strokeWidth={1.5} />
                {wishlisted ? "Wishlisted" : "Wishlist"}
              </button>
              {product.purchasable && (
                <a
                  href={enquiryUrl}
                  {...(enquiryUrl.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="btn-hq-outline flex-1 !border-espresso/20"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  {isWhatsAppConfigured() ? "WhatsApp Inquiry" : "Ask a Question"}
                </a>
              )}
            </div>
          </div>

          {/* Accordions */}
          <Accordion type="multiple" defaultValue={["description"]} className="mt-10 border-t border-border">
            <AccordionItem value="description">
              <AccordionTrigger className="text-[12px] font-semibold uppercase tracking-[0.2em] text-espresso hover:text-gold hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-espresso/75">
                {product.description}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fabric">
              <AccordionTrigger className="text-[12px] font-semibold uppercase tracking-[0.2em] text-espresso hover:text-gold hover:no-underline">
                Fabric &amp; Care
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-espresso/75">
                {product.fabricDetails && <p>{product.fabricDetails}</p>}
                {product.careInstructions && (
                  <p className="mt-2">
                    <span className="font-semibold text-espresso">Care:</span> {product.careInstructions}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-[12px] font-semibold uppercase tracking-[0.2em] text-espresso hover:text-gold hover:no-underline">
                Delivery &amp; Returns
              </AccordionTrigger>
              <AccordionContent className="text-[14px] leading-relaxed text-espresso/75">
                <p>
                  Orders are confirmed personally before dispatch. Shipping timelines and charges are
                  shown at checkout — complimentary shipping on orders above ₹4,999.
                </p>
                <p className="mt-2">
                  Questions about this piece? Use WhatsApp inquiry above — we reply with fabric
                  details, fit advice and availability.
                </p>
                <p className="mt-2">
                  Read our{" "}
                  <a href="/shipping-policy" className="underline decoration-gold underline-offset-2">
                    shipping
                  </a>{" "}
                  and{" "}
                  <a href="/returns-policy" className="underline decoration-gold underline-offset-2">
                    returns
                  </a>{" "}
                  policies.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <SizeGuideDialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} />
    </div>
  );
}
