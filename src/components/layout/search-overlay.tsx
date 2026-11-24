"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Sheet } from "@/components/storefront/sheet";
import { formatINR } from "@/lib/money";
import { hasPrice, merchandise, photoPosition } from "@/lib/storefront";
import type { ProductDTO } from "@/lib/types";

export function SearchOverlay({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductDTO[] | null>(null);
  const [failed, setFailed] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (open) input.current?.focus();
    else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    setFailed(false);
    if (q.length < 2) {
      setResults(null);
      return;
    }
    const abort = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=24`, { signal: abort.signal });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(merchandise(data.products ?? []));
      } catch {
        if (!abort.signal.aborted) setFailed(true);
      }
    }, 240);
    return () => {
      clearTimeout(t);
      abort.abort();
    };
  }, [q]);

  return (
    <Sheet open={open} onClose={onClose} side="top" label="Search the collection">
      <div className="wrap pb-10 pt-4 md:pb-14">
        <form
          role="search"
          className="flex items-center gap-4 border-b border-ink"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q) return;
            onClose();
            router.push(`/shop?search=${encodeURIComponent(q)}`);
          }}
        >
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            aria-label="Search the collection"
            autoComplete="off"
            enterKeyHint="search"
            className="t-head min-w-0 flex-1 bg-transparent py-4 !tracking-[-0.015em] placeholder:text-ink-soft/70 focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="inline-flex size-11 shrink-0 items-center justify-center">
            <X className="size-5" strokeWidth={1.4} />
          </button>
        </form>

        <div className="mt-7" aria-live="polite">
          {q.length < 2 ? (
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[1.0313rem]">
              {[...links, { label: "Shop everything", href: "/shop" }].map((l) => (
                <Link key={l.href} href={l.href} onClick={onClose} className="link py-1">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : failed ? (
            <p className="text-ink-soft">Search is not responding. Check your connection and try again.</p>
          ) : results === null ? (
            <p className="text-ink-soft">Searching for “{q}”</p>
          ) : results.length === 0 ? (
            <p className="text-ink-soft">
              Nothing found for “{q}”. Try a garment, such as abaya or skirt, or{" "}
              <Link href="/shop" onClick={onClose} className="link text-ink">
                see everything
              </Link>
              .
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-6">
                {results.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link href={`/product/${p.slug}`} onClick={onClose} className="group block">
                      <span className="photo photo-hover block aspect-[3/4]">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt="" fill sizes="(max-width: 640px) 45vw, 15vw" style={{ objectPosition: photoPosition(p.images[0]) }} />
                        )}
                      </span>
                      <span className="mt-2.5 block font-medium leading-snug">{p.name}</span>
                      <span className="price mt-0.5 block text-[0.9375rem] text-ink-soft">
                        {hasPrice(p) ? formatINR(p.price) : "Price on request"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/shop?search=${encodeURIComponent(q)}`}
                onClick={onClose}
                className="link mt-8 inline-block py-1 font-medium"
              >
                {results.length > 6 ? `See all ${results.length} results` : "Open these results in the shop"}
              </Link>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}
