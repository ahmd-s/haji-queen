"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, CreditCard, ShieldCheck } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart-store";
import { formatINR } from "@/lib/money";
import { shippingFor, RAZORPAY_ENABLED } from "@/lib/site";
import { pixelEvents } from "@/lib/pixel";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Other",
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "West Bengal",
    pincode: "",
    paymentMethod: "COD" as "COD" | "BANK_TRANSFER" | "RAZORPAY",
    customerNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  // InitiateCheckout fires once when checkout opens with a real bag
  useEffect(() => {
    if (items.length > 0) {
      pixelEvents.initiateCheckout(total, items.reduce((n, i) => n + i.quantity, 0));
    }
     
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const paymentOptions = useMemo(
    () => [
      {
        value: "COD" as const,
        icon: Banknote,
        title: "Cash on Delivery",
        desc: "Pay when your order arrives. Our team will confirm by phone or WhatsApp before dispatch.",
      },
      {
        value: "BANK_TRANSFER" as const,
        icon: Landmark,
        title: "Bank Transfer",
        desc: "Transfer details are shared personally after you place the order. Your order is reserved for 48 hours.",
      },
      ...(RAZORPAY_ENABLED
        ? [
            {
              value: "RAZORPAY" as const,
              icon: CreditCard,
              title: "Pay Online (Razorpay)",
              desc: "UPI, cards and netbanking via our secure payment partner.",
            },
          ]
        : []),
    ],
    []
  );

  const validate = (): string | null => {
    if (items.some((i) => i.price <= 0)) {
      return "Your bag contains a piece with a pending price. Please enquire about it before checkout.";
    }
    if (form.customerName.trim().length < 2) return "Please enter your full name.";
    if (!/^[+0-9][0-9\s-]{7,15}$/.test(form.phone.trim())) return "Please enter a valid mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address.";
    if (form.addressLine1.trim().length < 5) return "Please enter your delivery address.";
    if (form.city.trim().length < 2) return "Please enter your city.";
    if (!/^\d{6}$/.test(form.pincode.trim())) return "Please enter a valid 6-digit pincode.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          addressLine2: form.addressLine2 || undefined,
          customerNote: form.customerNote || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not place your order. Please try again.");
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-hq flex flex-col items-center gap-5 py-28 text-center">
        <p className="font-display text-3xl text-espresso">Your bag is empty</p>
        <p className="text-sm text-taupe">Add a piece to your bag before checking out.</p>
        <Link href="/shop" className="btn-hq-primary mt-2">
          Explore The Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container-hq py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-taupe">
        Home <span className="mx-1.5 text-gold">/</span> Bag <span className="mx-1.5 text-gold">/</span> Checkout
      </nav>
      <h1 className="display-1 mt-3 text-espresso">Checkout</h1>

      <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        {/* Details */}
        <div className="space-y-10">
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-display text-2xl text-espresso">
              Contact Details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="customerName" className="field-label">Full name *</label>
                <input id="customerName" className="field-hq" value={form.customerName} onChange={set("customerName")} placeholder="Your name" autoComplete="name" required />
              </div>
              <div>
                <label htmlFor="phone" className="field-label">Mobile number *</label>
                <input id="phone" className="field-hq" value={form.phone} onChange={set("phone")} placeholder="+91 …" inputMode="tel" autoComplete="tel" required />
              </div>
              <div>
                <label htmlFor="email" className="field-label">Email *</label>
                <input id="email" type="email" className="field-hq" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" required />
              </div>
            </div>
          </section>

          <section aria-labelledby="address-heading">
            <h2 id="address-heading" className="font-display text-2xl text-espresso">
              Delivery Address
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="addressLine1" className="field-label">Address line 1 *</label>
                <input id="addressLine1" className="field-hq" value={form.addressLine1} onChange={set("addressLine1")} placeholder="House / flat, street, area" autoComplete="address-line1" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="addressLine2" className="field-label">Address line 2 (optional)</label>
                <input id="addressLine2" className="field-hq" value={form.addressLine2} onChange={set("addressLine2")} placeholder="Landmark, apartment…" autoComplete="address-line2" />
              </div>
              <div>
                <label htmlFor="city" className="field-label">City *</label>
                <input id="city" className="field-hq" value={form.city} onChange={set("city")} autoComplete="address-level2" required />
              </div>
              <div>
                <label htmlFor="state" className="field-label">State *</label>
                <select id="state" className="field-hq" value={form.state} onChange={set("state")} autoComplete="address-level1">
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pincode" className="field-label">Pincode *</label>
                <input id="pincode" className="field-hq" value={form.pincode} onChange={set("pincode")} placeholder="6-digit pincode" inputMode="numeric" autoComplete="postal-code" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="customerNote" className="field-label">Order note (optional)</label>
                <textarea id="customerNote" className="field-hq h-20 py-2.5" value={form.customerNote} onChange={set("customerNote")} placeholder="Sizing help, delivery preferences…" />
              </div>
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-display text-2xl text-espresso">
              Payment Method
            </h2>
            <div className="mt-5 space-y-3">
              {paymentOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 border p-4 transition-colors",
                    form.paymentMethod === opt.value
                      ? "border-gold bg-champagne/25"
                      : "border-border hover:border-espresso/40"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={set("paymentMethod")}
                    className="mt-1 accent-[#b58a36]"
                  />
                  <opt.icon className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.5} />
                  <span>
                    <span className="block text-[14px] font-semibold text-espresso">{opt.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-espresso/65">
                      {opt.desc}
                    </span>
                  </span>
                </label>
              ))}
              {!RAZORPAY_ENABLED && (
                <p className="flex items-center gap-2 text-[12px] text-taupe">
                  <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                  Online payment (UPI &amp; cards) will be available soon through Razorpay.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit border border-border bg-cream/40 p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl text-espresso">Your Order</h2>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                  {i.image && <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex-1 text-[13px]">
                  <p className="font-medium leading-snug text-espresso">{i.name}</p>
                  <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.1em] text-taupe">
                    {i.color} · {i.size} · ×{i.quantity}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-espresso">
                  {formatINR(i.price * i.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2.5 border-t border-border pt-5 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-espresso/70">Subtotal</dt>
              <dd className="font-medium">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/70">Shipping</dt>
              <dd className="font-medium">{shipping === 0 ? "Complimentary" : formatINR(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-[16px]">
              <dt className="font-semibold text-espresso">Total</dt>
              <dd className="font-semibold text-espresso">{formatINR(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 border border-destructive/30 bg-destructive/5 p-3 text-[13px] leading-relaxed text-destructive">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-hq-primary mt-6 w-full">
            {submitting ? "Placing your order…" : "Place Order"}
          </button>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-taupe">
            By placing this order you agree to our{" "}
            <Link href="/terms" className="underline decoration-gold underline-offset-2">terms</Link> and{" "}
            <Link href="/privacy-policy" className="underline decoration-gold underline-offset-2">privacy policy</Link>.
            We will contact you to confirm before dispatch.
          </p>
        </aside>
      </form>
    </div>
  );
}
