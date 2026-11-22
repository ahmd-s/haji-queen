"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

type ContentMap = Record<string, unknown>;

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => setContent(d.content ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string, value: unknown) => {
    setSavingKey(key);
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSavingKey(null);
    if (res.ok) toast({ title: `“${key}” updated`, description: "Changes are live on the website." });
    else toast({ title: "Save failed" });
  };

  if (loading) return <p className="mt-8 text-sm text-taupe">Loading content…</p>;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">CMS</p>
      <h1 className="mt-1 font-display text-3xl text-espresso">Website Content</h1>
      <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-taupe">
        Edit homepage copy, awards, social links and contact details — changes apply to the
        storefront immediately. Fields marked as placeholders should be replaced with verified
        business information.
      </p>

      <div className="mt-8 space-y-6">
        {/* Announcement */}
        {content.announcement !== undefined && (
          <SectionCard title="Announcement Bar" description="Slim message above the navigation.">
            <AnnouncementEditor
              value={content.announcement as { text: string; href?: string; enabled?: boolean }}
              onSave={(v) => save("announcement", v)}
              saving={savingKey === "announcement"}
            />
          </SectionCard>
        )}

        {/* Hero */}
        {content.hero !== undefined && (
          <SectionCard title="Homepage Hero" description="Headline, introduction and campaign image.">
            <KeyValueEditor
              fields={[
                { key: "headline", label: "Headline" },
                { key: "subtext", label: "Supporting text", textarea: true },
                { key: "primaryCta", label: "Primary CTA" },
                { key: "secondaryCta", label: "Secondary CTA" },
                { key: "image", label: "Image path (e.g. /images/hero-main.jpg)" },
              ]}
              value={content.hero as Record<string, string>}
              onSave={(v) => save("hero", v)}
              saving={savingKey === "hero"}
            />
          </SectionCard>
        )}

        {/* Story */}
        {content.story !== undefined && (
          <SectionCard title="Brand Story Section" description="Homepage story blurb.">
            <KeyValueEditor
              fields={[
                { key: "headline", label: "Headline" },
                { key: "body", label: "Body", textarea: true },
                { key: "image", label: "Image path" },
              ]}
              value={content.story as Record<string, string>}
              onSave={(v) => save("story", v)}
              saving={savingKey === "story"}
            />
          </SectionCard>
        )}

        {/* Curated */}
        {content.curated !== undefined && (
          <SectionCard title="Curated Collections Note" description="The espresso strip explaining supplier curation.">
            <KeyValueEditor
              fields={[
                { key: "headline", label: "Headline" },
                { key: "body", label: "Body", textarea: true },
              ]}
              value={content.curated as Record<string, string>}
              onSave={(v) => save("curated", v)}
              saving={savingKey === "curated"}
            />
          </SectionCard>
        )}

        {/* Measurements */}
        {content.measurements !== undefined && (
          <SectionCard title="Measurements Section" description="The “Made To Fit You” block.">
            <KeyValueEditor
              fields={[
                { key: "headline", label: "Headline" },
                { key: "body", label: "Body", textarea: true },
              ]}
              value={content.measurements as Record<string, string>}
              onSave={(v) => save("measurements", v)}
              saving={savingKey === "measurements"}
            />
          </SectionCard>
        )}

        {/* Awards */}
        {content.awards !== undefined && (
          <SectionCard
            title="Awards & Recognition"
            description="Shown on the homepage and Our Story. Replace placeholder entries with verified details."
          >
            <AwardsEditor
              value={content.awards as { title: string; detail: string; year: string }[]}
              onSave={(v) => save("awards", v)}
              saving={savingKey === "awards"}
            />
          </SectionCard>
        )}

        {/* Social */}
        {content.social !== undefined && (
          <SectionCard title="Social & Gallery" description="Links and Instagram gallery images.">
            <SocialEditor
              value={content.social as { instagram?: string; facebook?: string; instagramHandle?: string; gallery?: string[] }}
              onSave={(v) => save("social", v)}
              saving={savingKey === "social"}
            />
          </SectionCard>
        )}

        {/* Contact */}
        {content.contact !== undefined && (
          <SectionCard title="Contact Details" description="Shown in the footer and contact page.">
            <KeyValueEditor
              fields={[
                { key: "email", label: "Email" },
                { key: "phoneDisplay", label: "Phone (display)" },
                { key: "address", label: "Address" },
                { key: "hours", label: "Hours" },
              ]}
              value={content.contact as Record<string, string>}
              onSave={(v) => save("contact", v)}
              saving={savingKey === "contact"}
            />
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-display text-xl text-espresso">{title}</h2>
      <p className="mt-1 text-[12px] text-taupe">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  label = "Save",
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-hq-primary !px-5 !py-2 !text-[11px]">
      {saving ? "Saving…" : label}
    </button>
  );
}

function KeyValueEditor({
  fields,
  value,
  onSave,
  saving,
}: {
  fields: { key: string; label: string; textarea?: boolean }[];
  value: Record<string, string>;
  onSave: (v: Record<string, string>) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // draft initialised from value; editors remount per section
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="field-label">{f.label}</label>
          {f.textarea ? (
            <textarea
              className="field-hq h-20 py-2.5"
              value={draft[f.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
          ) : (
            <input
              className="field-hq"
              value={draft[f.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <SaveButton onClick={() => onSave(draft)} saving={saving} />
    </div>
  );
}

function AnnouncementEditor({
  value,
  onSave,
  saving,
}: {
  value: { text: string; href?: string; enabled?: boolean };
  onSave: (v: { text: string; href?: string; enabled?: boolean }) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // draft initialised from value; editors remount per section
  return (
    <div className="space-y-3">
      <div>
        <label className="field-label">Text</label>
        <input className="field-hq" value={draft.text ?? ""} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Link (optional)</label>
          <input className="field-hq" value={draft.href ?? ""} onChange={(e) => setDraft({ ...draft, href: e.target.value })} />
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-[13px] text-espresso">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#b58a36]"
            checked={draft.enabled ?? true}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />
          Show announcement bar
        </label>
      </div>
      <SaveButton onClick={() => onSave(draft)} saving={saving} />
    </div>
  );
}

function AwardsEditor({
  value,
  onSave,
  saving,
}: {
  value: { title: string; detail: string; year: string }[];
  onSave: (v: { title: string; detail: string; year: string }[]) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // draft initialised from value; editors remount per section
  return (
    <div className="space-y-4">
      {draft.map((a, i) => (
        <div key={i} className="border border-border p-4">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe">
              Entry {i + 1}
            </p>
            <button
              onClick={() => setDraft(draft.filter((_, j) => j !== i))}
              className="text-taupe hover:text-destructive"
              aria-label="Remove entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
            <input
              className="field-hq"
              value={a.year}
              onChange={(e) => {
                const next = [...draft];
                next[i] = { ...a, year: e.target.value };
                setDraft(next);
              }}
              placeholder="Year"
            />
            <input
              className="field-hq"
              value={a.title}
              onChange={(e) => {
                const next = [...draft];
                next[i] = { ...a, title: e.target.value };
                setDraft(next);
              }}
              placeholder="Award title"
            />
            <textarea
              className="field-hq h-16 py-2.5 sm:col-span-2"
              value={a.detail}
              onChange={(e) => {
                const next = [...draft];
                next[i] = { ...a, detail: e.target.value };
                setDraft(next);
              }}
              placeholder="Detail / placeholder note"
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDraft([...draft, { title: "", detail: "", year: "20XX" }])}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-gold hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add entry
        </button>
        <SaveButton onClick={() => onSave(draft)} saving={saving} />
      </div>
    </div>
  );
}

function SocialEditor({
  value,
  onSave,
  saving,
}: {
  value: { instagram?: string; facebook?: string; instagramHandle?: string; gallery?: string[] };
  onSave: (v: { instagram?: string; facebook?: string; instagramHandle?: string; gallery?: string[] }) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // draft initialised from value; editors remount per section
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="field-label">Instagram URL</label>
          <input className="field-hq" value={draft.instagram ?? ""} onChange={(e) => setDraft({ ...draft, instagram: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Facebook URL</label>
          <input className="field-hq" value={draft.facebook ?? ""} onChange={(e) => setDraft({ ...draft, facebook: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Instagram handle</label>
          <input className="field-hq" value={draft.instagramHandle ?? ""} onChange={(e) => setDraft({ ...draft, instagramHandle: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="field-label">Gallery image paths (one per line)</label>
        <textarea
          className="field-hq h-28 py-2.5"
          value={(draft.gallery ?? []).join("\n")}
          onChange={(e) => setDraft({ ...draft, gallery: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
        />
      </div>
      <SaveButton onClick={() => onSave(draft)} saving={saving} />
    </div>
  );
}
