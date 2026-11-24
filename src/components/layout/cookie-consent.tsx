"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, flushPixel } from "@/lib/pixel";
import { META_PIXEL_ID } from "@/lib/site";

/**
 * Marketing consent. The Meta Pixel fires only after "Allow". When no pixel is
 * configured the site sets no marketing cookies, so there is nothing to ask.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!META_PIXEL_ID || window.localStorage.getItem(CONSENT_KEY)) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const decide = (granted: boolean) => {
    window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    setShow(false);
    if (granted) flushPixel();
  };

  if (!show) return null;
  return (
    <section
      aria-label="Cookie preferences"
      className="fade-in fixed inset-x-3 bottom-3 z-[65] border border-sand bg-paper p-5 sm:left-6 sm:right-auto sm:max-w-sm"
    >
      <p className="text-[0.9375rem] leading-relaxed">
        May we use marketing cookies to see how our collections reach you? The shop works fully without them.{" "}
        <Link href="/privacy-policy" className="link">
          Privacy policy
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => decide(false)} className="btn btn-line !min-h-11 !px-3">
          Essential only
        </button>
        <button type="button" onClick={() => decide(true)} className="btn btn-solid !min-h-11 !px-3">
          Allow
        </button>
      </div>
    </section>
  );
}
