"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress line so links to another page respond the moment they are tapped.
 * Reads only the pathname: useSearchParams here would force a client-rendered
 * boundary into every static page.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setFrom(location.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!from) return;
    const t = setTimeout(() => setFrom(null), 10000);
    return () => clearTimeout(t);
  }, [from]);

  return from === pathname ? <div className="nav-progress" aria-hidden="true" /> : null;
}
