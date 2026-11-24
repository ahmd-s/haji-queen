"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Sheet } from "@/components/storefront/sheet";
import { photoPosition, photoRatio, photoSize } from "@/lib/storefront";
import { cn } from "@/lib/utils";

/**
 * Swipeable on touch, thumbnails on desktop, full-screen zoom on both.
 * Mount with key={colour} so a new colour always starts on its first photo.
 */
export function ProductGallery({ images, name, colour }: { images: string[]; name: string; colour?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [magnified, setMagnified] = useState(false);
  const many = images.length > 1;
  const title = colour ? `${name} in ${colour}` : name;
  // Frame follows the photo so nothing important is cropped away.
  const ratio = Math.min(1, Math.max(0.72, photoRatio(images[0])));

  const goTo = (i: number, smooth = true) => {
    const next = (i + images.length) % images.length;
    setIndex(next);
    setMagnified(false);
    const el = track.current;
    el?.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "instant" });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!zoomOpen || !many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1, false);
      if (e.key === "ArrowLeft") goTo(index - 1, false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, many, index]);

  const current = images[index] ?? images[0];
  const arrow =
    "absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center bg-paper/85 transition-opacity hover:bg-paper focus-visible:opacity-100 md:inline-flex md:opacity-0 md:group-hover/g:opacity-100";

  return (
    <div className="flex gap-4">
      {many && (
        <div className="hidden w-[4.75rem] shrink-0 flex-col gap-2.5 lg:flex">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={cn(
                "photo aspect-[3/4] w-full transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-ink after:transition-transform after:duration-300",
                i === index ? "after:scale-x-100" : "opacity-65 after:scale-x-0 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="76px" style={{ objectPosition: photoPosition(src) }} />
            </button>
          ))}
        </div>
      )}

      <div
        className="group/g relative -mx-[var(--gutter)] min-w-0 flex-1 md:mx-0 md:max-w-[calc((100svh-1.5rem)*var(--ratio))] md:min-w-[26rem]"
        style={{ "--ratio": ratio } as React.CSSProperties}
      >
        <div
          ref={track}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label={`Enlarge photo ${i + 1} of ${images.length}`}
              tabIndex={i === index ? 0 : -1}
              className="photo fade-in block w-full shrink-0 snap-center !cursor-zoom-in"
              style={{ aspectRatio: ratio }}
            >
              <Image
                src={src}
                alt={many ? `${title}, photo ${i + 1}` : title}
                fill
                quality={85}
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 55vw, 720px"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                style={{ objectPosition: photoPosition(src) }}
              />
            </button>
          ))}
        </div>
        {many && (
          <>
            <button type="button" className={cn(arrow, "left-0")} onClick={() => goTo(index - 1)} aria-label="Previous photo">
              <ChevronLeft className="size-5" strokeWidth={1.4} />
            </button>
            <button type="button" className={cn(arrow, "right-0")} onClick={() => goTo(index + 1)} aria-label="Next photo">
              <ChevronRight className="size-5" strokeWidth={1.4} />
            </button>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 bg-paper/85 px-3 py-1.5 text-sm">
          <ZoomIn className="size-4" strokeWidth={1.4} aria-hidden="true" />
          {many ? (
            <span className="price">
              {index + 1} / {images.length}
            </span>
          ) : (
            "Zoom"
          )}
        </span>
      </div>

      <Sheet
        open={zoomOpen}
        onClose={() => {
          setZoomOpen(false);
          setMagnified(false);
        }}
        side="full"
        label={`${title}, enlarged photo`}
      >
        {zoomOpen && (
          <div className="relative h-full">
            <div className="h-full overflow-auto overscroll-contain">
              {magnified ? (
                <button type="button" onClick={() => setMagnified(false)} className="mx-auto block !cursor-zoom-out" aria-label="Fit photo to screen">
                  <Image
                    src={current}
                    alt={title}
                    {...photoSize(current)}
                    quality={85}
                    sizes="1400px"
                    className="h-auto w-[max(150vw,1100px)] max-w-none md:w-[1400px]"
                  />
                </button>
              ) : (
                <button type="button" onClick={() => setMagnified(true)} className="relative block h-full w-full !cursor-zoom-in" aria-label="Magnify photo">
                  <Image src={current} alt={title} fill quality={85} sizes="100vw" className="object-contain" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setZoomOpen(false);
                setMagnified(false);
              }}
              aria-label="Close enlarged photo"
              className="absolute right-3 top-3 inline-flex size-12 items-center justify-center bg-paper/90"
            >
              <X className="size-5" strokeWidth={1.4} />
            </button>
            {many && (
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center bg-paper/90">
                <button type="button" onClick={() => goTo(index - 1, false)} aria-label="Previous photo" className="inline-flex size-12 items-center justify-center">
                  <ChevronLeft className="size-5" strokeWidth={1.4} />
                </button>
                <span className="price px-2 text-[0.9375rem]">
                  {index + 1} / {images.length}
                </span>
                <button type="button" onClick={() => goTo(index + 1, false)} aria-label="Next photo" className="inline-flex size-12 items-center justify-center">
                  <ChevronRight className="size-5" strokeWidth={1.4} />
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
