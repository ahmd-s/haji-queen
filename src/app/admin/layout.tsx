"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Settings2,
  MessageSquareText,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquareText },
  { href: "/admin/content", label: "Site Content", icon: Settings2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page renders standalone
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-espresso text-ivory max-lg:hidden">
        <div className="border-b border-ivory/10 px-5 py-5">
          <Logo dark compact />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Admin">
          {NAV.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-gold/15 font-semibold text-gold"
                    : "text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-ivory/10 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            View Website
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] text-ivory/75 hover:bg-ivory/5 hover:text-ivory"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 bg-espresso px-4 py-3 text-ivory lg:hidden">
        <Logo dark compact />
        <nav className="flex gap-1 overflow-x-auto no-scrollbar" aria-label="Admin mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-[11px]",
                pathname === item.href ? "text-gold" : "text-ivory/75"
              )}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-[11px] text-ivory/75"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Out
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-20 lg:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
