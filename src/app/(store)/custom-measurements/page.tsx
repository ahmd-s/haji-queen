"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageCircle, Ruler } from "lucide-react";
import { isWhatsAppConfigured, waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

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
} & Partial<Record<(typeof MEASUREMENT_FIELDS)[number]["key"] | "otherMeasurements", string>>;

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
    <div className="pb-24">
      {/* Header */}
      <header className="border-b border-border bg-cream/40">
        <div className="container-hq-narrow py-14 text-center lg:py-20">
          <p className="kicker justify-center">Custom Measurements</p>
          <h1 className="display-1 mt-4 text-espresso">Your Fit. Your Way.</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-espresso/70">
            Every woman deserves clothing that feels as beautiful as it looks. Share your
            measurements and let us assist you with your sizing requirements.
          </p>
        </div>
      </header>

      <div className="container-hq-narrow mt-12">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gold/40 bg-champagne/25 p-10 text-center"
            >
              <CheckCircle2 className="mx-auto h-10 w-10 text-gold" strokeWidth={1.5} />
              <h2 className="display-3 mt-4 text-espresso">Request Received</h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-espresso/70">
                {success.message}
              </p>
              <p className="mx-auto mt-2 max-w-md text-[12.5px] text-taupe">
                Your measurements are stored securely and visible only to our fit team.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                {isWhatsAppConfigured() && (
                  <a href={waFollowUp} target="_blank" rel="noopener noreferrer" className="btn-hq-primary">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    Continue on WhatsApp
                  </a>
                )}
                <button onClick={() => { setSuccess(null); setForm(INITIAL); }} className="btn-hq-outline">
                  New Request
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={submit}
              className="space-y-12"
              noValidate
            >
              {/* Personal details */}
              <section aria-labelledby="pd-heading">
                <h2 id="pd-heading" className="font-display text-2xl text-espresso">
                  Personal Details
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="field-label">Full name *</label>
                    <input id="fullName" className="field-hq" value={form.fullName} onChange={set("fullName")} required autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="mphone" className="field-label">Phone number *</label>
                    <input id="mphone" className="field-hq" value={form.phone} onChange={set("phone")} placeholder="+91 …" inputMode="tel" required autoComplete="tel" />
                  </div>
                  <div>
                    <label htmlFor="memail" className="field-label">Email</label>
                    <input id="memail" type="email" className="field-hq" value={form.email} onChange={set("email")} autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="preferredContact" className="field-label">Preferred contact method</label>
                    <select id="preferredContact" className="field-hq" value={form.preferredContact} onChange={set("preferredContact")}>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Phone call</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Garment preferences */}
              <section aria-labelledby="gp-heading">
                <h2 id="gp-heading" className="font-display text-2xl text-espresso">
                  Garment Preferences
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="garmentType" className="field-label">Garment type *</label>
                    <select id="garmentType" className="field-hq" value={form.garmentType} onChange={set("garmentType")}>
                      {GARMENT_TYPES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="colorPreference" className="field-label">Preferred colour</label>
                    <input id="colorPreference" className="field-hq" value={form.colorPreference} onChange={set("colorPreference")} placeholder="e.g. Onyx black, champagne…" />
                  </div>
                  <div>
                    <label htmlFor="sizingPreference" className="field-label">Sizing</label>
                    <select
                      id="sizingPreference"
                      className="field-hq"
                      value={form.sizingPreference}
                      onChange={(e) => setForm((f) => ({ ...f, sizingPreference: e.target.value as "STANDARD" | "CUSTOM" }))}
                    >
                      <option value="CUSTOM">Custom sizing (recommended)</option>
                      <option value="STANDARD">Standard size</option>
                    </select>
                  </div>
                  {form.sizingPreference === "STANDARD" && (
                    <div>
                      <label htmlFor="standardSize" className="field-label">Your usual size</label>
                      <select id="standardSize" className="field-hq" value={form.standardSize} onChange={set("standardSize")}>
                        {["XS", "S", "M", "L", "XL"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label htmlFor="designNotes" className="field-label">Preferred design</label>
                    <textarea id="designNotes" className="field-hq h-20 py-2.5" value={form.designNotes} onChange={set("designNotes")} placeholder="Describe the style you have in mind — silhouette, occasion, details you love…" />
                  </div>
                </div>
              </section>

              {/* Measurements */}
              <section aria-labelledby="m-heading">
                <div className="flex items-center justify-between gap-4">
                  <h2 id="m-heading" className="font-display text-2xl text-espresso">
                    Measurements
                  </h2>
                  <p className="hidden items-center gap-1.5 text-[12px] text-taupe sm:flex">
                    <Ruler className="h-3.5 w-3.5" /> Inches or cm — whatever is easiest
                  </p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {MEASUREMENT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label htmlFor={f.key} className="field-label">{f.label}</label>
                      <input id={f.key} className="field-hq" value={form[f.key] ?? ""} onChange={set(f.key)} placeholder={f.hint} />
                    </div>
                  ))}
                  <div>
                    <label htmlFor="otherMeasurements" className="field-label">Other measurements</label>
                    <input id="otherMeasurements" className="field-hq" value={form.otherMeasurements ?? ""} onChange={set("otherMeasurements")} placeholder="Anything else we should know" />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="instructions" className="field-label">Additional instructions</label>
                    <textarea id="instructions" className="field-hq h-20 py-2.5" value={form.instructions} onChange={set("instructions")} placeholder="Fit preferences, concerns, reference notes…" />
                  </div>
                </div>
              </section>

              {/* Consultation */}
              <section aria-labelledby="c-heading">
                <h2 id="c-heading" className="font-display text-2xl text-espresso">
                  Preferred Consultation
                </h2>
                <p className="mt-2 text-[13px] text-taupe">
                  Pick a convenient slot — we will confirm availability before it is final.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="consultationDate" className="field-label">Preferred date</label>
                    <input id="consultationDate" type="date" className="field-hq" value={form.consultationDate} onChange={set("consultationDate")} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div>
                    <label htmlFor="consultationTime" className="field-label">Preferred time</label>
                    <input id="consultationTime" type="time" className="field-hq" value={form.consultationTime} onChange={set("consultationTime")} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="referenceImageUrl" className="field-label">Reference image link (optional)</label>
                  <input id="referenceImageUrl" className="field-hq" value={form.referenceImageUrl ?? ""} onChange={set("referenceImageUrl")} placeholder="Paste a link to a style you love" />
                </div>
              </section>

              {/* Consent */}
              <section className="border border-border bg-cream/40 p-5">
                <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed text-espresso/80">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-[#b58a36]"
                  />
                  <span>
                    I understand my measurements are sensitive personal information. I consent to
                    Haji Queens storing them securely and using them only to assist with my sizing,
                    alterations and made-to-measure requests. Access is restricted to authorised
                    staff. See our{" "}
                    <a href="/privacy-policy" className="underline decoration-gold underline-offset-2">privacy policy</a>.
                  </span>
                </label>
              </section>

              {error && (
                <p className="border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={submitting} className="btn-hq-primary">
                  {submitting ? "Sending…" : "Submit Measurement Request"}
                </button>
                <p className="text-[12px] text-taupe">
                  This is a request — our team will confirm your consultation personally.
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
