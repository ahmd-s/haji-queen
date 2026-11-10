"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CONSENT_KEY, flushPixel } from "@/lib/pixel";

/**
 * Cookie / marketing consent banner.
 * Meta Pixel fires only after explicit consent ("Accept").
 * Privacy policy link included per disclosure requirements.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(CONSENT_KEY);
    if (!existing) {
      const t = setTimeout(() => setShow(true), 1400);
      return () => clearTimeout(t);
    }
  }, []);

  const decide = (granted: boolean) => {
    window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    setShow(false);
    if (granted) flushPixel();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 z-[65] mx-auto max-w-xl border border-border bg-white p-5 shadow-[0_16px_48px_rgba(48,40,32,0.16)] sm:bottom-6"
          role="dialog"
          aria-label="Cookie preferences"
        >
          <p className="text-[13px] leading-relaxed text-espresso/85">
            We use cookies to improve your browsing experience and — only with your permission —
            to understand how our collections reach you. See our{" "}
            <Link href="/privacy-policy" className="underline decoration-gold underline-offset-2 hover:text-gold">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => decide(true)} className="btn-hq-primary flex-1 !py-3 !px-5">
              Accept
            </button>
            <button
              onClick={() => decide(false)}
              className="btn-hq-outline flex-1 !py-3 !px-5"
            >
              Essential Only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
