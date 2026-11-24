"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { itemOptions } from "@/components/storefront/bag-lines";
import { useCart, cartCount, cartSubtotal } from "@/store/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatINR } from "@/lib/money";
import { shippingFor, RAZORPAY_ENABLED } from "@/lib/site";
import { photoPosition } from "@/lib/storefront";
import { pixelEvents } from "@/lib/pixel";
import { cn } from "@/lib/utils";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Other",
];

type Form = {
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "COD" | "BANK_TRANSFER" | "RAZORPAY";
  customerNote: string;
};
type Errors = Partial<Record<keyof Form, string>>;

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [form, setForm] = useState<Form>({
    customerName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "West Bengal",
    pincode: "",
    paymentMethod: "COD",
    customerNote: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
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

  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setErrors((x) => (x[k] ? { ...x, [k]: undefined } : x));
    };

  const paymentOptions = useMemo(
    () => [
      {
        value: "COD" as const,
        title: "Cash on delivery",
        desc: "Pay when your order arrives. We contact you to confirm before dispatch.",
      },
      {
        value: "BANK_TRANSFER" as const,
        title: "Bank transfer",
        desc: "We share the account details with you personally after you place the order.",
      },
      ...(RAZORPAY_ENABLED
        ? [
            {
              value: "RAZORPAY" as const,
              title: "Pay online",
              desc: "UPI, cards and netbanking through Razorpay.",
            },
          ]
        : []),
    ],
    []
  );

  const validate = (): Errors => {
    const x: Errors = {};
    if (form.customerName.trim().length < 2) x.customerName = "Enter your full name";
    if (!/^[+0-9][0-9\s-]{7,15}$/.test(form.phone.trim())) x.phone = "Enter a valid mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) x.email = "Enter a valid email address";
    if (form.addressLine1.trim().length < 5) x.addressLine1 = "Enter your house or flat, street and area";
    if (form.city.trim().length < 2) x.city = "Enter your city";
    if (!/^\d{6}$/.test(form.pincode.trim())) x.pincode = "Enter a 6-digit pincode";
    return x;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.some((i) => i.price <= 0)) {
      setError("Your bag contains a piece whose price is not confirmed. Remove it, or ask us about it, before checkout.");
      return;
    }
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
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
        setError(data.error ?? "Your order was not placed. Please try again.");
        setSubmitting(false);
        return;
      }
      setPlaced(true);
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setError("Your order was not placed. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (!hydrated || placed) {
    return (
      <div className="wrap min-h-[70vh] pt-10 md:pt-16" aria-busy="true">
        <h1 className="t-title">{placed ? "Placing your order" : "Checkout"}</h1>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="wrap min-h-[60vh] pt-10 md:pt-16">
        <h1 className="t-title">Checkout</h1>
        <p className="t-body mt-5">Your bag is empty. Add a piece before checking out.</p>
        <Link href="/new-arrivals" className="btn btn-solid mt-8">
          See new arrivals
        </Link>
      </div>
    );
  }

  const field = (
    k: keyof Form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    className?: string
  ) => (
    <div className={className}>
      <label htmlFor={k} className="label">
        {label}
      </label>
      <input
        id={k}
        className="field"
        value={form[k]}
        onChange={set(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `${k}-error` : undefined}
        {...props}
      />
      {errors[k] && (
        <p id={`${k}-error`} className="field-error">
          {errors[k]}
        </p>
      )}
    </div>
  );

  const lines = (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.key} className="flex gap-4">
          <div className="photo aspect-[3/4] w-[4.5rem] shrink-0">
            {i.image && (
              <Image src={i.image} alt="" fill sizes="72px" style={{ objectPosition: photoPosition(i.image) }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-4">
              <p className="font-medium leading-snug">{i.name}</p>
              <p className="price shrink-0">{formatINR(i.price * i.quantity)}</p>
            </div>
            <p className="mt-1 text-[0.9375rem] text-ink-soft">{itemOptions(i)}</p>
            <p className="text-[0.9375rem] text-ink-soft">Quantity {i.quantity}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  const totals = (
    <dl className="space-y-2">
      <div className="flex justify-between">
        <dt className="text-ink-soft">Subtotal</dt>
        <dd className="price">{formatINR(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-soft">Shipping</dt>
        <dd className="price">{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
      </div>
      <div className="flex justify-between border-t border-sand pt-4 text-[1.1875rem] font-medium">
        <dt>Total</dt>
        <dd className="price">{formatINR(total)}</dd>
      </div>
    </dl>
  );

  return (
    <div className="wrap pb-[var(--section)] pt-8 md:pt-14">
      <ol className="flex flex-wrap gap-x-3 text-[0.9375rem] text-ink-soft" aria-label="Checkout progress">
        <li>
          <Link href="/cart" className="link">
            Bag
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="step" className="font-medium text-ink">
          Details and payment
        </li>
        <li aria-hidden="true">/</li>
        <li>Confirmation</li>
      </ol>
      <h1 className="t-title mt-3">Checkout</h1>

      {/* Order first on small screens, folded away */}
      <details className="fold mt-6 border-y border-sand lg:hidden">
        <summary>
          <span>
            Your order, {cartCount(items)} {cartCount(items) === 1 ? "piece" : "pieces"}{" "}
            <span className="price">({formatINR(total)})</span>
          </span>
        </summary>
        <div className="space-y-6 pb-6">{lines}</div>
      </details>

      <form
        onSubmit={submit}
        noValidate
        className="mt-9 grid gap-x-[clamp(2.5rem,6vw,6rem)] gap-y-10 lg:grid-cols-[1.45fr_1fr]"
      >
        <div className="space-y-12">
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="t-sub">
              Your details
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {field("customerName", "Full name", { autoComplete: "name" }, "sm:col-span-2")}
              {field("phone", "Mobile number", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
              {field("email", "Email", { type: "email", autoComplete: "email" })}
            </div>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">We use these only to confirm and deliver your order.</p>
          </section>

          <section aria-labelledby="address-heading">
            <h2 id="address-heading" className="t-sub">
              Delivery address
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {field("addressLine1", "House or flat, street, area", { autoComplete: "address-line1" }, "sm:col-span-2")}
              {field("addressLine2", "Landmark (optional)", { autoComplete: "address-line2" }, "sm:col-span-2")}
              {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
              {field("city", "City", { autoComplete: "address-level2" })}
              <div className="sm:col-span-2">
                <label htmlFor="state" className="label">
                  State
                </label>
                <select id="state" className="field" value={form.state} onChange={set("state")} autoComplete="address-level1">
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="customerNote" className="label">
                  Note for us (optional)
                </label>
                <textarea
                  id="customerNote"
                  className="field min-h-24"
                  maxLength={500}
                  value={form.customerNote}
                  onChange={set("customerNote")}
                  placeholder="Sizing questions, delivery preferences"
                />
              </div>
            </div>
          </section>

          <fieldset>
            <legend className="t-sub">Payment</legend>
            <div className="mt-5 border border-[#cbbba6]">
              {paymentOptions.map((opt) => {
                const on = form.paymentMethod === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-start gap-4 p-5 transition-colors [&:not(:first-child)]:border-t [&:not(:first-child)]:border-[#cbbba6]",
                      on ? "bg-shell" : "hover:bg-shell/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={on}
                      onChange={set("paymentMethod")}
                      className="mt-1 size-[1.15rem] shrink-0 accent-[#2a201a]"
                    />
                    <span>
                      <span className="block font-medium">{opt.title}</span>
                      <span className="mt-0.5 block text-[0.9375rem] text-ink-soft">{opt.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit bg-shell p-6 sm:p-9 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="t-sub hidden lg:block">Your order</h2>
          <div className="mt-6 hidden max-h-[22rem] overflow-y-auto border-b border-sand pb-6 lg:block">{lines}</div>
          <div className="lg:mt-6">{totals}</div>

          {error && (
            <p role="alert" className="mt-5 border-l-2 border-clay bg-paper p-4 text-[0.9375rem] text-clay">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-solid mt-6 w-full">
            {submitting ? "Placing your order" : "Place order"}
          </button>
          <p className="mt-5 text-[0.9375rem] text-ink-soft">
            We contact you to confirm before anything is dispatched. By placing this order you agree to our{" "}
            <Link href="/terms" className="link text-ink">
              terms
            </Link>
            ,{" "}
            <Link href="/returns-policy" className="link text-ink">
              returns policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="link text-ink">
              privacy policy
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  );
}
