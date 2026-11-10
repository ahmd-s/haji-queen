"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ClipboardList, Clock, CheckCircle2, MessageSquareText, IndianRupee } from "lucide-react";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  newInquiries: number;
  totalRevenue: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  itemCount: number;
  createdAt: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setRecent(d.recentOrders ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Products", value: stats.totalProducts, icon: Package, href: "/admin/products" },
        { label: "Total Orders", value: stats.totalOrders, icon: ClipboardList, href: "/admin/orders" },
        { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, href: "/admin/orders" },
        { label: "Completed Orders", value: stats.completedOrders, icon: CheckCircle2, href: "/admin/orders" },
        { label: "New Inquiries", value: stats.newInquiries, icon: MessageSquareText, href: "/admin/inquiries" },
        {
          label: "Order Value (all time)",
          value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
          icon: IndianRupee,
          href: "/admin/orders",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Overview</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Dashboard</h1>
        </div>
        <p className="hidden text-[12px] text-taupe sm:block">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border border-border bg-cream/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {cards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group border border-border bg-white p-5 transition-colors hover:border-gold"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-taupe">
                    {c.label}
                  </p>
                  <c.icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                </div>
                <p className="mt-3 font-display text-3xl text-espresso">{c.value}</p>
              </Link>
            ))}
          </div>

          {/* Recent orders */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-espresso">Recent Orders</h2>
              <Link href="/admin/orders" className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold hover:underline">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 border border-border bg-white p-6 text-[13px] text-taupe">
                No orders yet. Orders placed on the website appear here instantly.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto border border-border bg-white">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-cream/40 text-[11px] uppercase tracking-[0.14em] text-taupe">
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Items</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-semibold text-espresso">
                          <Link href="/admin/orders" className="hover:text-gold">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-espresso/80">{o.customerName}</td>
                        <td className="px-4 py-3 text-espresso/80">{o.itemCount}</td>
                        <td className="px-4 py-3 font-medium text-espresso">
                          ₹{Math.round(o.total).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={o.status} />
                        </td>
                        <td className="px-4 py-3 text-espresso/80">{o.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-champagne text-gold-deep",
    CONFIRMED: "bg-champagne text-espresso",
    PROCESSING: "bg-champagne text-espresso",
    SHIPPED: "bg-espresso/10 text-espresso",
    DELIVERED: "bg-gold/15 text-gold-deep",
    CANCELLED: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${styles[status] ?? "bg-cream text-espresso"}`}>
      {status}
    </span>
  );
}
