"use client";
/**
 * Meta Pixel integration — fully configurable, disabled until NEXT_PUBLIC_META_PIXEL_ID
 * is set. Events are queued before consent and flushed after acceptance; duplicate
 * PageView events are guarded. Purchase fires ONLY on verified success pages.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { META_PIXEL_ID } from "@/lib/site";

export const CONSENT_KEY = "hq-cookie-consent"; // "granted" | "denied"

/** Minimal shape of the Meta pixel bootstrap function we rely on. */
type Fbq = ((...args: unknown[]) => void) & {
  push: (...args: unknown[]) => void;
  loaded: boolean;
  version: string;
  queue: unknown[];
  callMethod?: (...args: unknown[]) => void;
};

type PixelQueue = {
  queue: unknown[][];
  flushed: boolean;
  fbq?: Fbq;
};

const g = globalThis as unknown as { __hqPixel?: PixelQueue };

function state(): PixelQueue {
  if (!g.__hqPixel) g.__hqPixel = { queue: [], flushed: false };
  return g.__hqPixel;
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) === "granted";
}

export function track(event: string, data?: Record<string, unknown>) {
  if (!META_PIXEL_ID) return; // integration disabled
  const s = state();
  const payload = ["track", event, data ?? {}];
  if (s.flushed && s.fbq) {
    s.fbq(...payload);
  } else {
    s.queue.push(payload);
  }
}

/** Inject the pixel script once, after marketing consent is granted. */
export function flushPixel() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  const s = state();
  if (s.flushed) return;
  if (!hasConsent()) return;

  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (!w.fbq) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.id = "meta-pixel-sdk";
    document.head.appendChild(script);
    // Standard pixel bootstrap
    const anyWin = window as unknown as Record<string, unknown>;
    const fbq = function (...args: unknown[]) {
      const f = fbq as Fbq;
      if (typeof f.callMethod === "function") {
        f.callMethod(...args);
      } else {
        s.queue.push(args);
      }
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    anyWin.fbq = fbq;
    anyWin._fbq = fbq;
    s.fbq = fbq;
    fbq("init", META_PIXEL_ID);
  }
  s.flushed = true;
  // Flush queued events
  const queued = s.queue;
  s.queue = [];
  for (const evt of queued) {
    if (evt[0] === "track" && evt[1] === "PageView" && (evt[2] as { _hqDedupe?: boolean })?._hqDedupe) {
      continue; // never double-fire PageView
    }
    s.fbq!(...evt);
  }
}

/** Fires PageView on route change (deduped; only after consent). */
export function MetaPixelListener() {
  const pathname = usePathname();
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    if (hasConsent()) {
      flushPixel();
      const s = state();
      if (s.flushed && s.fbq) s.fbq("track", "PageView", { _hqDedupe: true });
      else s.queue.push(["track", "PageView", { _hqDedupe: true }]);
    }
  }, [pathname]);
  return null;
}

/** E-commerce event helpers with consistent identifiers. */
export const pixelEvents = {
  viewContent: (p: { id: string; name: string; price: number; category?: string }) =>
    track("ViewContent", {
      content_ids: [p.id],
      content_name: p.name,
      content_category: p.category,
      content_type: "product",
      value: p.price,
      currency: "INR",
    }),
  addToCart: (p: { id: string; name: string; price: number; quantity: number }) =>
    track("AddToCart", {
      content_ids: [p.id],
      content_name: p.name,
      content_type: "product",
      value: p.price * p.quantity,
      currency: "INR",
    }),
  initiateCheckout: (value: number, numItems: number) =>
    track("InitiateCheckout", { value, currency: "INR", num_items: numItems }),
  purchase: (value: number, orderNumber: string, ids: string[]) =>
    track("Purchase", { value, currency: "INR", order_id: orderNumber, content_ids: ids, content_type: "product" }),
};
