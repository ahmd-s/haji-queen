"use client";

import { useState } from "react";
import { PackageSearch, ShieldCheck } from "lucide-react";

type LookupResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  estimatedNote: string;
};

export default function AccountPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Could not find that order.");
      else setResult(data.order);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="container-hq-narrow py-14 lg:py-20">
      <p className="kicker">Client Care</p>
      <h1 className="display-1 mt-4 text-espresso">Track Your Order</h1>
      <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-espresso/70">
        Enter the order number from your confirmation along with the email or phone number used
        at checkout.
      </p>

      <form onSubmit={submit} className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="orderNumber" className="field-label">Order number</label>
          <input
            id="orderNumber"
            className="field-hq"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="HQ-123456"
            required
          />
        </div>
        <div>
          <label htmlFor="contact" className="field-label">Email or phone</label>
          <input
            id="contact"
            className="field-hq"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn-hq-primary w-full sm:w-auto">
            {loading ? "Looking up…" : "Track Order"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-6 max-w-xl border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 max-w-xl border border-gold/40 bg-champagne/25 p-6">
          <p className="font-display text-2xl text-espresso">{result.orderNumber}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[13.5px]">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Status</dt>
              <dd className="mt-0.5 font-semibold text-espresso">{result.status}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Payment</dt>
              <dd className="mt-0.5 font-semibold text-espresso">
                {result.paymentMethod} · {result.paymentStatus}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Total</dt>
              <dd className="mt-0.5 font-semibold text-espresso">₹{result.total.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Placed</dt>
              <dd className="mt-0.5 font-semibold text-espresso">
                {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-[13px] text-espresso/70">
            <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
            {result.estimatedNote}
          </p>
        </div>
      )}

      <p className="mt-12 flex max-w-xl items-start gap-2 text-[12.5px] leading-relaxed text-taupe">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
        Customer accounts are coming soon. Until then, order tracking and personal assistance are
        handled directly by our team — the way we have always done it.
      </p>
    </div>
  );
}
