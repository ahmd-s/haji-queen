"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Thin progress line so every internal link responds the moment it is tapped. */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [from, setFrom] = useState<string | null>(null);
  const here = `${pathname}?${search}`;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented && !(e.target as Element)?.closest?.("a")) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setFrom(`${location.pathname}?${location.search.slice(1)}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!from) return;
    const t = setTimeout(() => setFrom(null), 10000);
    return () => clearTimeout(t);
  }, [from]);

  return from !== null && from === here ? <div className="nav-progress" aria-hidden="true" /> : null;
}
