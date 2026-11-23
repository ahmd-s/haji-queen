"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  PackageSearch,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Every day",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/inquiries", label: "Enquiries", icon: MessageSquareText },
      { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
    ],
  },
  {
    title: "Catalogue & customers",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
      { href: "/admin/content", label: "Site content", icon: Settings2 },
    ],
  },
  {
    title: "Safety & setup",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
      { href: "/admin/audit", label: "Activity log", icon: History },
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function currentLabel(pathname: string): string {
  const match = ALL_ITEMS.filter((item) => item.href !== "/admin")
    .filter((item) => isActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin sections" className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ivory/40">
            {group.title}
          </p>
          <div className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors",
                    active
                      ? "border-l-2 border-gold bg-gold/10 pl-[10px] font-semibold text-gold"
                      : "border-l-2 border-transparent text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UtilityLinks({ logout }: { logout: () => void }) {
  return (
    <div className="space-y-0.5">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
      >
        <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        View website
      </a>
      <button
        onClick={logout}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        Sign out
      </button>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Login page renders standalone without the admin shell.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const label = currentLabel(pathname);

  return (
    <UnsavedChangesProvider>
      <div className="min-h-screen bg-ivory">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-espresso text-ivory lg:flex">
          <div className="border-b border-ivory/10 px-5 py-5">
            <Logo dark compact />
            <p className="mt-3 pl-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-gold/80">
              Admin panel
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>
          <div className="border-t border-ivory/10 px-3 py-4">
            <UtilityLinks logout={() => void logout()} />
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-ivory/10 bg-espresso px-4 py-3 text-ivory lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center border border-ivory/20"
            aria-label="Open admin menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-[13px] font-semibold">{label}</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/50">Admin panel</p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center border border-ivory/20"
            aria-label="View website"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-[65] lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              className="absolute inset-0 bg-espresso/60"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-espresso text-ivory shadow-2xl">
              <div className="flex items-center justify-between border-b border-ivory/10 px-5 py-4">
                <Logo dark compact />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center text-ivory/70 hover:text-ivory"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-5">
                <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              </div>
              <div className="border-t border-ivory/10 px-3 py-4">
                <UtilityLinks
                  logout={() => {
                    setDrawerOpen(false);
                    void logout();
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="min-w-0 lg:pl-64">
          <div className="hidden items-center gap-1.5 border-b border-border bg-white/60 px-4 py-3 text-[11px] text-taupe lg:flex lg:px-8">
            <Link href="/admin" className="hover:text-gold">
              Admin
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-espresso">{label}</span>
          </div>
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-20 lg:px-8 lg:pt-8">{children}</main>
        </div>
      </div>
    </UnsavedChangesProvider>
  );
}
