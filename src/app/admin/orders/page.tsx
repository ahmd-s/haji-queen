"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/money";
import { StatusChip } from "@/app/admin/page";

type OrderItem = {
  id: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerNote: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Order | null>(null);
  const [filter, setFilter] = useState("ALL");

  const load = async () => {
    const d = await fetch("/api/admin/orders").then((r) => r.json());
    setOrders(d.orders ?? []);
    setLoading(false);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern
    load();
  }, []);

  const update = async (id: string, patch: Record<string, string>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast({ title: "Order updated" });
      const d = await res.json();
      setOpen((o) => (o ? { ...o, status: d.status ?? o.status, paymentStatus: d.paymentStatus ?? o.paymentStatus } : o));
      load();
    } else {
      const dd = await res.json();
      toast({ title: dd.error ?? "Update failed" });
    }
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Fulfilment</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Orders</h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                filter === s ? "bg-espresso text-ivory" : "border border-border text-espresso/70 hover:border-espresso"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-taupe">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 border border-border bg-white p-6 text-[13px] text-taupe">
          No orders in this view. Website orders appear here in real time.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-white">
          <table className="w-full min-w-[780px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-cream/40 text-[11px] uppercase tracking-[0.14em] text-taupe">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-espresso">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-espresso/80">
                    {o.customerName}
                    <br />
                    <span className="text-[11.5px] text-taupe">{o.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-espresso/70">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3 font-medium text-espresso">{formatINR(o.total)}</td>
                  <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                  <td className="px-4 py-3 text-espresso/80">
                    {o.paymentMethod}
                    <br />
                    <span className="text-[11.5px] text-taupe">{o.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setOpen(o)}
                      className="border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso hover:border-gold hover:text-gold"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-espresso/50 p-4 py-10">
          <div className="w-full max-w-2xl bg-ivory shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-2xl text-espresso">{open.orderNumber}</h2>
                <p className="text-[11.5px] text-taupe">
                  {new Date(open.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="inline-flex h-9 w-9 items-center justify-center hover:text-gold" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* Status controls */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Order status</label>
                  <select
                    className="field-hq"
                    value={open.status}
                    onChange={(e) => update(open.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Payment status</label>
                  <select
                    className="field-hq"
                    value={open.paymentStatus}
                    onChange={(e) => update(open.id, { paymentStatus: e.target.value })}
                  >
                    {["UNPAID", "PAID", "REFUNDED", "FAILED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer */}
              <div className="border border-border bg-white p-4 text-[13px]">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-taupe">Customer</p>
                <p className="mt-2 font-semibold text-espresso">{open.customerName}</p>
                <p className="text-espresso/75">{open.phone} · {open.email}</p>
                <p className="mt-2 text-espresso/75">
                  {open.addressLine1}
                  {open.addressLine2 ? `, ${open.addressLine2}` : ""}
                  <br />
                  {open.city}, {open.state} — {open.pincode}
                </p>
                {open.customerNote && (
                  <p className="mt-2 border-l-2 border-gold pl-3 text-[12.5px] italic text-espresso/70">
                    “{open.customerNote}”
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-taupe">Items</p>
                <ul className="mt-2 divide-y divide-border border border-border bg-white">
                  {open.items.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                      <div>
                        <p className="font-medium text-espresso">{i.productName}</p>
                        <p className="text-[11.5px] text-taupe">
                          {i.color} · {i.size} · ×{i.quantity} @ {formatINR(i.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold text-espresso">{formatINR(i.lineTotal)}</p>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 text-[13px]">
                  <div className="flex justify-between"><dt className="text-espresso/70">Subtotal</dt><dd>{formatINR(open.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-espresso/70">Shipping</dt><dd>{open.shippingFee === 0 ? "Complimentary" : formatINR(open.shippingFee)}</dd></div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold text-espresso">
                    <dt>Total</dt><dd>{formatINR(open.total)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
