"use client";

import { useState } from "react";
import Link from "next/link";

export type EnquiryProduct = { name: string; slug: string; url: string; colour?: string; size?: string };

type Errors = { fullName?: string; phone?: string; email?: string; message?: string; consent?: string };

/**
 * Sends to the existing /api/inquiries endpoint, so enquiries land in the same
 * admin inbox as measurement requests. The endpoint and its fields are unchanged.
 */
export function EnquiryForm({ product }: { product?: EnquiryProduct }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    preferredContact: "WHATSAPP" as "WHATSAPP" | "PHONE" | "EMAIL",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (k: "fullName" | "phone" | "email" | "message" | "preferredContact") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setErrors((x) => ({ ...x, [k]: undefined }));
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    const x: Errors = {};
    if (form.fullName.trim().length < 2) x.fullName = "Enter your name";
    if (!/^[+0-9][0-9\s-]{7,15}$/.test(form.phone.trim())) x.phone = "Enter a valid phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) x.email = "Enter a valid email address";
    else if (form.preferredContact === "EMAIL" && !form.email) x.email = "Add your email so we can reply there";
    if (!product && form.message.trim().length < 3) x.message = "Tell us how we can help";
    if (!form.consent) x.consent = "Please allow us to use these details to reply to you";
    setErrors(x);
    const first = Object.keys(x)[0];
    if (first) {
      document.getElementById(`enq-${first}`)?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email.trim(),
          preferredContact: form.preferredContact,
          garmentType: (product?.name ?? "General enquiry").slice(0, 80),
          colorPreference: product?.colour ?? "",
          sizingPreference: product?.size ? "STANDARD" : "CUSTOM",
          standardSize: product?.size?.slice(0, 10) ?? "",
          designNotes: product ? `Product enquiry: ${product.url}`.slice(0, 600) : "",
          instructions: form.message.slice(0, 600),
          consent: true,
          source: product ? `product-enquiry:${product.slug}`.slice(0, 120) : "contact-page",
        }),
      });
      const data = await res.json();
      if (!res.ok) setFailure(data.error ?? "Your message was not sent. Please try again.");
      else setSent(true);
    } catch {
      setFailure("Your message was not sent. Check your connection and try again.");
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="fade-in bg-shell p-7 sm:p-10" role="status">
        <h2 className="t-head">We have your message.</h2>
        <p className="mt-3 max-w-[48ch] text-ink-soft">
          {product ? `Thank you for asking about ${product.name}. ` : "Thank you for writing. "}
          Our team will reply to you personally.
        </p>
        <Link href="/shop" className="btn btn-line mt-7">
          Continue shopping
        </Link>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] && (
      <p id={`enq-${k}-error`} className="field-error">
        {errors[k]}
      </p>
    );
  const aria = (k: keyof Errors) => ({
    "aria-invalid": Boolean(errors[k]),
    "aria-describedby": errors[k] ? `enq-${k}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="enq-fullName" className="label">
          Your name
        </label>
        <input id="enq-fullName" className="field" value={form.fullName} onChange={set("fullName")} autoComplete="name" maxLength={80} {...aria("fullName")} />
        {err("fullName")}
      </div>
      <div>
        <label htmlFor="enq-phone" className="label">
          Phone number
        </label>
        <input id="enq-phone" type="tel" inputMode="tel" className="field" value={form.phone} onChange={set("phone")} autoComplete="tel" {...aria("phone")} />
        {err("phone")}
      </div>
      <div>
        <label htmlFor="enq-email" className="label">
          Email (optional)
        </label>
        <input id="enq-email" type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" {...aria("email")} />
        {err("email")}
      </div>
      <div>
        <label htmlFor="enq-preferredContact" className="label">
          Reply to me by
        </label>
        <select id="enq-preferredContact" className="field" value={form.preferredContact} onChange={set("preferredContact")}>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PHONE">Phone call</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="enq-message" className="label">
          {product ? "Your question (optional)" : "How can we help?"}
        </label>
        <textarea
          id="enq-message"
          className="field min-h-32"
          maxLength={600}
          value={form.message}
          onChange={set("message")}
          placeholder={product ? "Size, colour, fabric, when you need it" : undefined}
          {...aria("message")}
        />
        {err("message")}
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-[0.9375rem] text-ink-soft">
          <input
            id="enq-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => {
              setForm((f) => ({ ...f, consent: e.target.checked }));
              setErrors((x) => ({ ...x, consent: undefined }));
            }}
            className="mt-0.5 size-5 shrink-0 accent-[#2a201a]"
            {...aria("consent")}
          />
          <span>
            Haji Queens may store these details to reply to me.{" "}
            <Link href="/privacy-policy" className="link text-ink">
              Privacy policy
            </Link>
          </span>
        </label>
        {err("consent")}
      </div>
      {failure && (
        <p role="alert" className="border-l-2 border-clay bg-shell p-4 text-[0.9375rem] text-clay sm:col-span-2">
          {failure}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={sending} className="btn btn-solid w-full sm:w-auto">
          {sending ? "Sending" : product ? "Send enquiry" : "Send message"}
        </button>
      </div>
    </form>
  );
}
