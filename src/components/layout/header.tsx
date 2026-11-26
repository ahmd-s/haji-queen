"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { Wordmark } from "@/components/storefront/wordmark";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useCart, cartCount } from "@/store/cart-store";
import { useWishlist } from "@/store/wishlist-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { categoryLabel } from "@/lib/storefront";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/lib/types";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const items = useCart((s) => s.items);
  const openBag = useCart((s) => s.openDrawer);
  const closeBag = useCart((s) => s.closeDrawer);
  const wishlist = useWishlist((s) => s.items);
  const hydrated = useHydrated();
  const bagCount = hydrated ? cartCount(items) : 0;
  const wishCount = hydrated ? wishlist.length : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close anything open when the customer moves to another page.
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
    closeBag();
  }, [pathname, closeBag]);

  const links = [
    { label: "New arrivals", href: "/new-arrivals" },
    ...categories.map((c) => ({ label: categoryLabel(c), href: `/category/${c.slug}` })),
  ];

  const textLink = "relative py-2 text-[0.9375rem] transition-colors hover:text-olive";
  const iconButton = "relative inline-flex h-11 w-10 items-center justify-center sm:w-11";
  const count = (n: number) =>
    n > 0 && (
      <span className="price absolute right-0.5 top-1 flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-olive px-1 text-[0.6875rem] font-semibold leading-none text-paper">
        {n}
      </span>
    );

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] bg-ink px-5 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {announcement?.enabled && announcement.text && (
        <div className="intro-enter bg-ink text-paper">
          <Link
            href={announcement.href || "/shop"}
            className="wrap flex min-h-10 items-center justify-center py-2 text-center text-[0.875rem] leading-snug transition-colors hover:text-sand"
          >
            {announcement.text.replace(/\s*\|\s*/g, ". ")}
          </Link>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-paper transition-colors duration-300",
          scrolled ? "border-sand" : "border-transparent"
        )}
      >
        <div className="wrap grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-4 xl:h-[4.75rem]">
          {/* Left */}
          <div className="intro-enter flex items-center">
            <button type="button" className={cn(iconButton, "-ml-3 xl:hidden")} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="size-[1.35rem]" strokeWidth={1.4} />
            </button>
            <button type="button" className={cn(iconButton, "xl:hidden")} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search className="size-[1.2rem]" strokeWidth={1.4} />
            </button>
            <nav className="hidden items-center gap-7 xl:flex" aria-label="Collections">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      textLink,
                      "whitespace-nowrap after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-300",
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centre */}
          <Link href="/" aria-label="Haji Queens, home" className="py-2" data-brand>
            <Wordmark />
          </Link>

          {/* Right */}
          <div className="intro-enter flex items-center justify-end">
            <div className="hidden items-center gap-7 xl:flex">
              <button type="button" className={textLink} onClick={() => setSearchOpen(true)}>
                Search
              </button>
              <Link href="/account" className={textLink}>
                Orders
              </Link>
              <Link href="/wishlist" className={textLink}>
                Wishlist{wishCount > 0 && <span className="price"> ({wishCount})</span>}
              </Link>
              <button type="button" className={textLink} onClick={openBag}>
                Bag<span className="price"> ({bagCount})</span>
              </button>
            </div>
            <Link
              href="/wishlist"
              className={cn(iconButton, "xl:hidden")}
              aria-label={`Wishlist${wishCount ? `, ${wishCount} saved` : ""}`}
            >
              <Heart className="size-[1.2rem]" strokeWidth={1.4} />
              {count(wishCount)}
            </Link>
            <button
              type="button"
              className={cn(iconButton, "-mr-3 xl:hidden")}
              onClick={openBag}
              aria-label={`Shopping bag${bagCount ? `, ${bagCount} items` : ", empty"}`}
            >
              <ShoppingBag className="size-[1.2rem]" strokeWidth={1.4} />
              {count(bagCount)}
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} links={links} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
    </>
  );
}
