"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/money";

type LookupResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  estimatedNote: string;
};

const PAYMENT: Record<string, string> = {
  COD: "Cash on delivery",
  BANK_TRANSFER: "Bank transfer",
  RAZORPAY: "Online",
};
const words = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

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
      if (!res.ok) setError(data.error ?? "We could not find that order.");
      else setResult(data.order);
    } catch {
      setError("Check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div className="wrap-text min-h-[64vh] pb-[var(--section)] pt-10 md:pt-16">
      <h1 className="t-title">Track an order</h1>
      <p className="t-body mt-4">
        Enter the order number from your confirmation, with the email or phone number you used at checkout. You do not
        need an account.
      </p>

      <form onSubmit={submit} className="mt-9 grid max-w-2xl gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="orderNumber" className="label">
            Order number
          </label>
          <input
            id="orderNumber"
            className="field"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="HQ-123456"
            autoCapitalize="characters"
            required
          />
        </div>
        <div>
          <label htmlFor="contact" className="label">
            Email or phone
          </label>
          <input id="contact" className="field" value={contact} onChange={(e) => setContact(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-solid w-full sm:w-auto">
            {loading ? "Looking up your order" : "Track order"}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {error && (
          <div className="mt-8 max-w-2xl border-l-2 border-clay bg-shell p-5">
            <p>{error}</p>
            <p className="mt-1 text-ink-soft">
              Still stuck?{" "}
              <Link href="/contact" className="link text-ink">
                Contact us
              </Link>{" "}
              and we will look it up for you.
            </p>
          </div>
        )}

        {result && (
          <section className="fade-in mt-10 max-w-2xl bg-shell p-6 sm:p-9" aria-label={`Order ${result.orderNumber}`}>
            <h2 className="t-head">{words(result.status)}</h2>
            <p className="mt-2 text-ink-soft">{result.estimatedNote}</p>
            <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-sand pt-6 sm:grid-cols-2">
              {[
                ["Order", result.orderNumber],
                [
                  "Placed",
                  new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
                ],
                ["Total", formatINR(result.total)],
                ["Payment", `${PAYMENT[result.paymentMethod] ?? result.paymentMethod}, ${words(result.paymentStatus).toLowerCase()}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.9375rem] text-ink-soft">{k}</dt>
                  <dd className="price mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
