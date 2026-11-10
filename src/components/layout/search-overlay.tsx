"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatINR } from "@/lib/money";
import type { ProductDTO } from "@/lib/types";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.products ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] bg-ivory/98 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <div className="container-hq flex h-full flex-col">
            <div className="flex items-center justify-between py-5">
              <span className="kicker">Search</span>
              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center text-espresso hover:text-gold"
                aria-label="Close search"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex items-center gap-4 border-b border-espresso/25 pb-4">
                <Search className="h-5 w-5 text-taupe" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      onClose();
                      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
                    }
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="Search abayas, maxis, co-ords…"
                  className="w-full bg-transparent font-display text-2xl text-espresso placeholder:text-taupe/60 focus:outline-none md:text-3xl"
                  autoComplete="off"
                />
              </div>

              {!query && (
                <div className="mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-taupe">
                    Popular searches
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Abaya", "Floral Maxi", "Kurta set", "Workwear", "Evening"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="border border-border px-4 py-2 text-[12px] tracking-wide text-espresso transition-colors hover:border-gold hover:text-gold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query && (
                <div className="mt-8 max-h-[52vh] overflow-y-auto">
                  {loading && results.length === 0 ? (
                    <p className="py-8 text-center text-sm text-taupe">Searching…</p>
                  ) : results.length === 0 ? (
                    <p className="py-8 text-center text-sm text-taupe">
                      Nothing found for “{query}”. Try “abaya” or “maxi”.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {results.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.slug}`}
                            onClick={onClose}
                            className="group flex items-center gap-4 py-3"
                          >
                            <div className="h-20 w-16 shrink-0 overflow-hidden bg-cream">
                              {p.images[0] && (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-[12px] uppercase tracking-[0.14em] text-taupe">
                                {p.category.name}
                              </p>
                              <p className="mt-0.5 font-display text-lg text-espresso group-hover:text-gold">
                                {p.name}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-espresso">
                              {formatINR(p.price)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
