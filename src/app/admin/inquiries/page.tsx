"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone, Mail, Ruler } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Inquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  preferredContact: string;
  garmentType: string;
  designNotes: string | null;
  colorPreference: string | null;
  sizingPreference: string;
  standardSize: string | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  shoulder: string | null;
  sleeveLength: string | null;
  armhole: string | null;
  dressLength: string | null;
  otherMeasurements: string | null;
  instructions: string | null;
  consultationDate: string | null;
  consultationTime: string | null;
  status: string;
  internalNotes: string | null;
  createdAt: string;
};

const STATUSES = ["NEW", "IN_REVIEW", "SCHEDULED", "COMPLETED", "ARCHIVED"];
const MEAS_KEYS = [
  ["bust", "Bust"],
  ["waist", "Waist"],
  ["hips", "Hips"],
  ["shoulder", "Shoulder"],
  ["sleeveLength", "Sleeve"],
  ["armhole", "Armhole"],
  ["dressLength", "Length"],
  ["otherMeasurements", "Other"],
] as const;

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = async () => {
    const d = await fetch("/api/admin/inquiries").then((r) => r.json());
    setInquiries(d.inquiries ?? []);
    setLoading(false);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern
    load();
  }, []);

  const update = async (id: string, patch: Record<string, string | null>) => {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast({ title: "Inquiry updated" });
      load();
    } else {
      toast({ title: "Update failed" });
    }
  };

  const filtered = filter === "ALL" ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Client Requests</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Measurement Inquiries</h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-taupe">
            Sensitive customer information — handle with care and never share outside the team.
            Requests are not confirmed appointments until you accept them.
          </p>
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
        <p className="mt-8 text-sm text-taupe">Loading inquiries…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 border border-border bg-white p-6 text-[13px] text-taupe">
          No inquiries in this view. Measurement requests from the website arrive here instantly.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((i) => (
            <div key={i.id} className="border border-border bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-cream/30 px-5 py-4">
                <div>
                  <h2 className="font-display text-xl text-espresso">{i.fullName}</h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-taupe">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{i.phone}</span>
                    {i.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{i.email}</span>}
                    <span>prefers {i.preferredContact.toLowerCase()}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-espresso/70">
                    {i.garmentType} · {i.sizingPreference === "CUSTOM" ? "Custom sizing" : `Standard ${i.standardSize ?? ""}`}
                    {i.consultationDate && (
                      <> · requested {new Date(i.consultationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {i.consultationTime ? ` at ${i.consultationTime}` : ""}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${i.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center border border-border text-espresso hover:border-gold hover:text-gold"
                    aria-label={`WhatsApp ${i.fullName}`}
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                  <select
                    className="field-hq !h-9 w-32 text-[12px]"
                    value={i.status}
                    onChange={(e) => update(i.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 px-5 py-4 md:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-taupe">
                    <Ruler className="h-3.5 w-3.5" /> Measurements
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                    {MEAS_KEYS.map(([k, label]) =>
                      i[k] ? (
                        <div key={k} className="flex justify-between border-b border-border/60 pb-1">
                          <dt className="text-taupe">{label}</dt>
                          <dd className="font-medium text-espresso">{i[k]}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                </div>
                <div className="space-y-2 text-[12.5px] text-espresso/75">
                  {i.colorPreference && (
                    <p><span className="font-semibold text-espresso">Colour:</span> {i.colorPreference}</p>
                  )}
                  {i.designNotes && (
                    <p><span className="font-semibold text-espresso">Design:</span> {i.designNotes}</p>
                  )}
                  {i.instructions && (
                    <p><span className="font-semibold text-espresso">Instructions:</span> {i.instructions}</p>
                  )}
                  <div className="pt-1">
                    <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-taupe">
                      Internal notes
                    </label>
                    <textarea
                      className="field-hq h-16 py-2 text-[12.5px]"
                      defaultValue={i.internalNotes ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (i.internalNotes ?? "")) {
                          update(i.id, { internalNotes: e.target.value });
                        }
                      }}
                      placeholder="Team notes (saved when you click away)"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
