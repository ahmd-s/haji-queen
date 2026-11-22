"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useCart, cartCount } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavLink = { label: string; href: string };

export function Header({
  announcement,
  categories,
}: {
  announcement: { text: string; href?: string; enabled?: boolean } | null;
  categories: CategoryDTO[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useCart((s) => s.items);
  const openDrawer = useCart((s) => s.openDrawer);
  const wishlistItems = useWishlist((s) => s.items);
  const mounted = useHydrated();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeOverlays = useCallback(() => {
    setSearchOpen(false);
    setMobileOpen(false);
    setMegaOpen(false);
  }, []);

  const openMega = useCallback(() => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  }, []);
  const closeMega = useCallback(() => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 120);
  }, []);

  const links: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
    { label: "Our Story", href: "/our-story" },
  ];

  const bagCount = mounted ? cartCount(items) : 0;
  const wishCount = mounted ? wishlistItems.length : 0;

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Announcement bar */}
        {announcement?.enabled && announcement.text ? (
          <div className="bg-espresso text-ivory">
            <Link
              href={announcement.href || "/shop"}
              className="container-hq flex items-center justify-center py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.24em] hover:text-champagne transition-colors"
            >
              {announcement.text}
            </Link>
          </div>
        ) : null}

        {/* Main bar */}
        <div
          className={cn(
            "border-b bg-ivory/95 backdrop-blur-md transition-shadow duration-300",
            scrolled ? "border-border shadow-[0_1px_24px_rgba(48,40,32,0.06)]" : "border-transparent"
          )}
        >
          <div className="container-hq flex h-[72px] items-center justify-between gap-4">
            {/* Left: mobile menu + logo */}
            <div className="flex items-center gap-3">
              <button
                className="-ml-2 inline-flex h-11 w-11 items-center justify-center text-espresso lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <Link href="/" aria-label="Haji Queens — home">
                <Logo compact />
              </Link>
            </div>

            {/* Center: desktop nav */}
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
              {links.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                if (l.label === "Shop") {
                  return (
                    <div
                      key={l.href}
                      className="relative"
                      onMouseEnter={openMega}
                      onMouseLeave={closeMega}
                    >
                      <Link
                        href="/shop"
                        onClick={closeOverlays}
                        data-active={active || megaOpen}
                        className={cn(
                          "link-underline whitespace-nowrap py-6 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-colors",
                          active || megaOpen ? "text-gold" : "text-espresso hover:text-gold"
                        )}
                      >
                        Shop
                      </Link>
                    </div>
                  );
                }
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeOverlays}
                    data-active={active}
                    className={cn(
                      "link-underline whitespace-nowrap py-6 text-[12.5px] font-medium uppercase tracking-[0.16em] transition-colors",
                      active ? "text-gold" : "text-espresso hover:text-gold"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: icons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center text-espresso transition-colors hover:text-gold"
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <Link
                href="/account"
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center text-espresso transition-colors hover:text-gold"
                aria-label="Account"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
              <Link
                href="/wishlist"
                className="relative inline-flex h-11 w-11 items-center justify-center text-espresso transition-colors hover:text-gold"
                aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ""}`}
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {wishCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                    {wishCount}
                  </span>
                )}
              </Link>
              <button
                onClick={openDrawer}
                className="relative inline-flex h-11 w-11 items-center justify-center text-espresso transition-colors hover:text-gold"
                aria-label={`Shopping bag${bagCount ? `, ${bagCount} items` : ""}`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {bagCount > 0 && (
                  <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-espresso px-1 text-[9px] font-bold text-ivory">
                    {bagCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu (Shop) */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-x-0 top-full hidden border-b border-border bg-ivory shadow-[0_24px_48px_rgba(48,40,32,0.08)] lg:block"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
            >
              <div className="container-hq grid grid-cols-[1fr_1fr_1fr_1fr_1.15fr] gap-8 py-10">
                <div className="col-span-1 flex flex-col justify-center">
                  <p className="kicker">The Edit</p>
                  <p className="mt-4 font-display text-2xl leading-snug text-espresso">
                    Browse the full
                    <br />
                    collection
                  </p>
                  <Link
                    href="/shop"
                    className="link-underline mt-5 inline-block w-fit text-[12px] font-semibold uppercase tracking-[0.2em] text-gold"
                  >
                    View everything
                  </Link>
                </div>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="group block"
                  >
                    <div className="img-zoom aspect-[4/5] w-full bg-cream">
                      {c.tileImage && (
                         
                        <img
                          src={c.tileImage}
                          alt={c.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-espresso group-hover:text-gold transition-colors">
                      {c.name}
                    </p>
                    {c.tagline && (
                      <p className="mt-0.5 text-[12px] italic text-taupe font-display text-sm">
                        {c.tagline}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />
    </>
  );
}

export function HeaderIconX({ className }: { className?: string }) {
  return <X className={className} />;
}
