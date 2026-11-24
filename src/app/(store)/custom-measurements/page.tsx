"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isWhatsAppConfigured, waLink } from "@/lib/whatsapp";
import { EDITORIAL } from "@/lib/storefront";

const GARMENT_TYPES = [
  "Abaya",
  "Maxi / Dress",
  "Indo-Western Set",
  "Kurta / Co-ord",
  "Corporate / Formal",
  "Other",
];

const MEASUREMENT_FIELDS = [
  { key: "bust", label: "Bust", hint: 'e.g. 36"' },
  { key: "waist", label: "Waist", hint: 'e.g. 30"' },
  { key: "hips", label: "Hips", hint: 'e.g. 39"' },
  { key: "shoulder", label: "Shoulder", hint: 'e.g. 14.5"' },
  { key: "sleeveLength", label: "Sleeve length", hint: 'e.g. 23"' },
  { key: "armhole", label: "Armhole", hint: 'e.g. 16"' },
  { key: "dressLength", label: "Garment length", hint: 'e.g. 56"' },
] as const;

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  preferredContact: "WHATSAPP" | "PHONE" | "EMAIL";
  garmentType: string;
  designNotes: string;
  colorPreference: string;
  sizingPreference: "STANDARD" | "CUSTOM";
  standardSize: string;
  instructions: string;
  consultationDate: string;
  consultationTime: string;
  consent: boolean;
} & Partial<
  Record<(typeof MEASUREMENT_FIELDS)[number]["key"] | "otherMeasurements" | "referenceImageUrl", string>
>;

const INITIAL: FormState = {
  fullName: "",
  phone: "",
  email: "",
  preferredContact: "WHATSAPP",
  garmentType: "Abaya",
  designNotes: "",
  colorPreference: "",
  sizingPreference: "CUSTOM",
  standardSize: "",
  instructions: "",
  consultationDate: "",
  consultationTime: "",
  consent: false,
};

export default function CustomMeasurementsPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string } | null>(null);

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[+0-9][0-9\s-]{7,15}$/.test(form.phone.trim()))
      return setError("Please enter a valid phone number.");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Please enter a valid email address.");
    if (!form.consent)
      return setError("Please confirm you're happy for us to store your measurements securely.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "custom-measurements-page" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSuccess({ message: data.message });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  const waFollowUp = waLink(
    `Hello Haji Queens! I just submitted a measurement request (${form.garmentType}). Name: ${form.fullName}.`
  );

  return (
    <div className="pb-[var(--section)]">
      <header className="grid bg-shell md:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col justify-end px-[var(--gutter)] py-[clamp(3rem,7vw,6.5rem)]">
          <h1 className="t-hero max-w-[12ch]">Your fit, your way</h1>
          <p className="t-body mt-6">
            Clothing should feel as beautiful as it looks. Share your measurements and we will help you with sizing,
            alterations and made-to-measure pieces.
          </p>
        </div>
        <div className="photo hidden md:block md:min-h-[30rem]">
          <Image
            src={EDITORIAL.measure}
            alt="Close view of a ruffled white blouse gathered at the cuff"
            fill
            loading="eager"
            sizes="43vw"
            style={{ objectPosition: "50% 35%" }}
          />
        </div>
      </header>

      <div className="wrap-text mt-12 md:mt-16">
        {success ? (
          <div className="fade-in bg-shell p-7 sm:p-12" role="status">
            <h2 className="t-head">We have your measurements.</h2>
            <p className="t-body mt-3">
              Our team will contact you to confirm the details. This is a request, not a confirmed appointment yet.
            </p>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Your measurements are stored securely and used only to help with your sizing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isWhatsAppConfigured() && (
                <a href={waFollowUp} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
                  Continue on WhatsApp
                </a>
              )}
              <button type="button" onClick={() => { setSuccess(null); setForm(INITIAL); }} className="btn btn-line">
                Send another request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-14" noValidate>
              {/* Personal details */}
              <section aria-labelledby="pd-heading">
                <h2 id="pd-heading" className="t-sub">
                  Your details
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="label">Full name</label>
                    <input id="fullName" className="field" value={form.fullName} onChange={set("fullName")} required autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="mphone" className="label">Phone number</label>
                    <input id="mphone" className="field" value={form.phone} onChange={set("phone")} placeholder="+91 …" inputMode="tel" required autoComplete="tel" />
                  </div>
                  <div>
                    <label htmlFor="memail" className="label">Email</label>
                    <input id="memail" type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="preferredContact" className="label">Preferred contact method</label>
                    <select id="preferredContact" className="field" value={form.preferredContact} onChange={set("preferredContact")}>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Phone call</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Garment preferences */}
              <section aria-labelledby="gp-heading">
                <h2 id="gp-heading" className="t-sub">
                  The garment
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="garmentType" className="label">Garment type</label>
                    <select id="garmentType" className="field" value={form.garmentType} onChange={set("garmentType")}>
                      {GARMENT_TYPES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="colorPreference" className="label">Preferred colour</label>
                    <input id="colorPreference" className="field" value={form.colorPreference} onChange={set("colorPreference")} placeholder="e.g. Onyx black, champagne…" />
                  </div>
                  <div>
                    <label htmlFor="sizingPreference" className="label">Sizing</label>
                    <select
                      id="sizingPreference"
                      className="field"
                      value={form.sizingPreference}
                      onChange={(e) => setForm((f) => ({ ...f, sizingPreference: e.target.value as "STANDARD" | "CUSTOM" }))}
                    >
                      <option value="CUSTOM">Custom sizing (recommended)</option>
                      <option value="STANDARD">Standard size</option>
                    </select>
                  </div>
                  {form.sizingPreference === "STANDARD" && (
                    <div>
                      <label htmlFor="standardSize" className="label">Your usual size</label>
                      <select id="standardSize" className="field" value={form.standardSize} onChange={set("standardSize")}>
                        {["XS", "S", "M", "L", "XL"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label htmlFor="designNotes" className="label">Preferred design</label>
                    <textarea id="designNotes" className="field min-h-24" value={form.designNotes} onChange={set("designNotes")} placeholder="Describe the style you have in mind: silhouette, occasion, details you love…" />
                  </div>
                </div>
              </section>

              {/* Measurements */}
              <section aria-labelledby="m-heading">
                <div className="flex items-center justify-between gap-4">
                  <h2 id="m-heading" className="t-sub">
                    Measurements
                  </h2>
                  <p className="hidden text-[0.9375rem] text-ink-soft sm:block">Inches or centimetres, whichever is easier</p>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  {MEASUREMENT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={f.key} className="label">{f.label}</label>
                      <input id={f.key} className="field" value={form[f.key] ?? ""} onChange={set(f.key)} placeholder={f.hint} />
                    </div>
                  ))}
                  <div>
                    <label htmlFor="otherMeasurements" className="label">Other measurements</label>
                    <input id="otherMeasurements" className="field" value={form.otherMeasurements ?? ""} onChange={set("otherMeasurements")} placeholder="Anything else we should know" />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="instructions" className="label">Additional instructions</label>
                    <textarea id="instructions" className="field min-h-24" value={form.instructions} onChange={set("instructions")} placeholder="Fit preferences, concerns, reference notes…" />
                  </div>
                </div>
              </section>

              {/* Consultation */}
              <section aria-labelledby="c-heading">
                <h2 id="c-heading" className="t-sub">
                  A time to talk
                </h2>
                <p className="mt-2 text-[0.9375rem] text-ink-soft">
                  Choose a time that suits you. We confirm availability before it is final.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="consultationDate" className="label">Preferred date</label>
                    <input id="consultationDate" type="date" className="field" value={form.consultationDate} onChange={set("consultationDate")} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div>
                    <label htmlFor="consultationTime" className="label">Preferred time</label>
                    <input id="consultationTime" type="time" className="field" value={form.consultationTime} onChange={set("consultationTime")} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="referenceImageUrl" className="label">Reference image link (optional)</label>
                  <input id="referenceImageUrl" className="field" value={form.referenceImageUrl ?? ""} onChange={set("referenceImageUrl")} placeholder="Paste a link to a style you love" />
                </div>
              </section>

              {/* Consent */}
              <section className="bg-shell p-5 sm:p-7">
                <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    className="mt-0.5 size-5 shrink-0 accent-[#2a201a]"
                  />
                  <span>
                    I understand my measurements are sensitive personal information. I consent to
                    Haji Queens storing them securely and using them only to assist with my sizing,
                    alterations and made-to-measure requests. Access is restricted to authorised
                    staff. See our{" "}
                    <a href="/privacy-policy" className="link text-ink">privacy policy</a>.
                  </span>
                </label>
              </section>

              {error && (
                <p role="alert" className="border-l-2 border-clay bg-shell p-4 text-[0.9375rem] text-clay">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={submitting} className="btn btn-solid">
                  {submitting ? "Sending" : "Send my measurements"}
                </button>
                <p className="text-[0.9375rem] text-ink-soft">
                  This is a request. We confirm your consultation with you personally.
                </p>
              </div>
          </form>
        )}
      </div>
    </div>
  );
}
