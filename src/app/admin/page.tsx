"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  ArrowUpRight,
  ClipboardList,
  IndianRupee,
  MessageSquareText,
  Package,
  PackageSearch,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { InquiryStatusBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status";
import {
  AdminPageHeader,
  AdminTableScroll,
  EmptyState,
  ErrorState,
  LoadingState,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import { formatINR } from "@/lib/money";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  newInquiries: number;
  totalRevenue: number;
  paidRevenue: number;
  lowStock: number;
  pendingPrices: number;
  enquiryOnly: number;
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

type RecentInquiry = {
  id: string;
  fullName: string;
  garmentType: string;
  status: string;
  createdAt: string;
};

type StatsResponse = {
  stats: Stats;
  recentOrders: RecentOrder[];
  recentInquiries: RecentInquiry[];
};

type AttentionItem = {
  label: string;
  detail: string;
  count: number;
  href: string;
  icon: LucideIcon;
  tone: "urgent" | "soon";
};

export default function AdminDashboard() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<StatsResponse>("/api/admin/stats"));
    } catch (err) {
      setError(errorMessage(err, "Dashboard could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = data?.stats;
  const attention: AttentionItem[] = stats
    ? [
        {
          label: "Orders to process",
          detail: "New, confirmed or preparing — open the next one first.",
          count: stats.pendingOrders,
          href: "/admin/orders",
          icon: ClipboardList,
          tone: stats.pendingOrders > 0 ? "urgent" : "soon",
        },
        {
          label: "New enquiries",
          detail: "Customers waiting for a measurement response.",
          count: stats.newInquiries,
          href: "/admin/inquiries",
          icon: MessageSquareText,
          tone: stats.newInquiries > 0 ? "urgent" : "soon",
        },
        {
          label: "Low stock options",
          detail: "Size and colour combinations at or below their alert level.",
          count: stats.lowStock,
          href: "/admin/inventory",
          icon: PackageSearch,
          tone: "soon",
        },
        {
          label: "Prices to confirm",
          detail: "Hidden products that still need a selling price.",
          count: stats.pendingPrices,
          href: "/admin/products",
          icon: Tags,
          tone: "soon",
        },
      ]
    : [];

  const cards: { label: string; value: string; icon: LucideIcon; href: string }[] = stats
    ? [
        {
          label: "Products in catalogue",
          value: String(stats.totalProducts),
          icon: Package,
          href: "/admin/products",
        },
        {
          label: "Orders placed",
          value: String(stats.totalOrders),
          icon: ClipboardList,
          href: "/admin/orders",
        },
        {
          label: "Orders delivered",
          value: String(stats.completedOrders),
          icon: ClipboardList,
          href: "/admin/orders",
        },
        {
          label: "Order value (not cancelled)",
          value: formatINR(stats.totalRevenue),
          icon: IndianRupee,
          href: "/admin/orders",
        },
        {
          label: "Value received",
          value: formatINR(stats.paidRevenue),
          icon: IndianRupee,
          href: "/admin/orders",
        },
        {
          label: "Enquiry-only pieces",
          value: String(stats.enquiryOnly),
          icon: MessageSquareText,
          href: "/admin/products",
        },
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Start here each day: the attention list shows what needs your action, and everything below is a click away."
        actions={
          <>
            <p className="hidden text-[12px] text-taupe sm:block">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center gap-1.5 border border-espresso bg-espresso px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory hover:bg-gold hover:text-espresso"
            >
              <Plus className="h-3.5 w-3.5" /> Add product
            </Link>
          </>
        }
      />

      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading dashboard…" /> : null}

        {data && stats ? (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-espresso">Needs your attention</h2>
                <span className="text-[11px] text-taupe">Updated whenever this page loads</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {attention.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-start gap-3 border bg-white p-4 transition-colors hover:border-gold ${
                      item.tone === "urgent" ? "border-gold/45 bg-champagne/20" : "border-border"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-cream text-gold">
                      <item.icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-espresso">{item.label}</span>
                        <span className="font-display text-2xl text-espresso">{item.count}</span>
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-relaxed text-taupe">
                        {item.detail}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-taupe group-hover:text-gold" />
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl text-espresso">At a glance</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {cards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className="group border border-border bg-white p-4 transition-colors hover:border-gold sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-taupe">
                        {card.label}
                      </p>
                      <card.icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                    </div>
                    <p className="mt-3 font-display text-2xl text-espresso sm:text-3xl">{card.value}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-espresso">Latest orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold hover:underline"
                >
                  View all orders
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="Orders placed on the website appear here as soon as they are submitted."
                />
              ) : (
                <AdminTableScroll minWidth={680}>
                  <thead>
                    <TableHeadRow>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Items</Th>
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th>Payment</Th>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/70 last:border-0">
                        <Td>
                          <Link href="/admin/orders" className="font-semibold text-espresso hover:text-gold">
                            {order.orderNumber}
                          </Link>
                          <span className="block text-[10.5px] text-taupe">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </Td>
                        <Td className="text-espresso/80">{order.customerName}</Td>
                        <Td className="text-espresso/70">{order.itemCount}</Td>
                        <Td className="font-medium text-espresso">{formatINR(order.total)}</Td>
                        <Td><OrderStatusBadge status={order.status} /></Td>
                        <Td><PaymentStatusBadge status={order.paymentStatus} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTableScroll>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-espresso">Open enquiries</h2>
                <Link
                  href="/admin/inquiries"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold hover:underline"
                >
                  Open inbox
                </Link>
              </div>
              {data.recentInquiries.length === 0 ? (
                <EmptyState
                  title="No open enquiries"
                  description="New and in-review measurement requests will show here."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.recentInquiries.map((inquiry) => (
                    <Link
                      key={inquiry.id}
                      href="/admin/inquiries"
                      className="border border-border bg-white p-4 transition-colors hover:border-gold"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium text-espresso">{inquiry.fullName}</p>
                        <InquiryStatusBadge status={inquiry.status} />
                      </div>
                      <p className="mt-1 truncate text-[11.5px] text-taupe">{inquiry.garmentType}</p>
                      <p className="mt-2 text-[10.5px] text-taupe">
                        {new Date(inquiry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
