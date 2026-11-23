"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import {
  AdminCard,
  AdminPageHeader,
  CheckRow,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  SmallButton,
} from "@/components/admin/ui";

type ContentMap = Record<string, unknown>;
type StringMap = Record<string, string>;

function clone(value: ContentMap): ContentMap {
  return JSON.parse(JSON.stringify(value)) as ContentMap;
}

function asStringMap(value: unknown): StringMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: StringMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = typeof entry === "string" ? entry : entry == null ? "" : String(entry);
  }
  return result;
}

type TextField = { key: string; label: string; textarea?: boolean; hint?: string };

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentMap>({});
  const [original, setOriginal] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirtyKeys = useMemo(
    () =>
      Object.keys(content).filter(
        (key) => JSON.stringify(content[key]) !== JSON.stringify(original[key])
      ),
    [content, original]
  );
  useUnsavedChanges(
    dirtyKeys.length > 0,
    "You have unsaved website content changes. Leave without saving?"
  );

  useEffect(() => {
    adminFetch<{ content: ContentMap }>("/api/admin/content")
      .then((data) => {
        const loaded = data.content ?? {};
        setContent(clone(loaded));
        setOriginal(clone(loaded));
      })
      .catch((err) => setError(errorMessage(err, "Website content could not be loaded.")))
      .finally(() => setLoading(false));
  }, []);

  const setSection = useCallback((key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveKey = async (key: string) => {
    setSavingKey(key);
    try {
      await adminFetch("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({ key, value: content[key] }),
      });
      setOriginal((prev) => ({ ...prev, [key]: clone({ value: content[key] }).value }));
      toast({ title: "Content saved", description: "The change is live on the website." });
    } catch (err) {
      toast({ title: "Could not save content", description: errorMessage(err) });
    } finally {
      setSavingKey(null);
    }
  };

  const saveAll = async () => {
    if (dirtyKeys.length === 0) return;
    setBusy(true);
    try {
      for (const key of dirtyKeys) {
        await adminFetch("/api/admin/content", {
          method: "PUT",
          body: JSON.stringify({ key, value: content[key] }),
        });
      }
      setOriginal(clone(content));
      toast({
        title: `${dirtyKeys.length} section${dirtyKeys.length === 1 ? "" : "s"} saved`,
        description: "Your website copy is up to date.",
      });
    } catch (err) {
      toast({ title: "Some changes were not saved", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const textEditor = (
    key: string,
    title: string,
    description: string,
    fields: TextField[]
  ) => {
    if (content[key] === undefined) return null;
    return (
      <ContentCard
        key={key}
        title={title}
        description={description}
        dirty={dirtyKeys.includes(key)}
        onSave={() => void saveKey(key)}
        saving={savingKey === key}
      >
        <TextFieldGroup
          fields={fields}
          value={asStringMap(content[key])}
          onChange={(value) => setSection(key, value)}
        />
      </ContentCard>
    );
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Site content"
        description="Edit the words customers see on the homepage and contact pages. Changes go live as soon as you save."
        actions={
          <SmallButton
            tone="primary"
            disabled={dirtyKeys.length === 0 || busy}
            onClick={() => void saveAll()}
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "Saving…" : dirtyKeys.length > 0 ? `Save ${dirtyKeys.length} change${dirtyKeys.length === 1 ? "" : "s"}` : "All changes saved"}
          </SmallButton>
        }
      />

      {dirtyKeys.length > 0 ? (
        <div className="mt-4 border border-amber-500/30 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900">
          You have unsaved changes in {dirtyKeys.length} section{dirtyKeys.length === 1 ? "" : "s"}.
          Save before leaving this page.
        </div>
      ) : null}

      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : null}
        {loading ? <LoadingState label="Loading website content…" /> : null}
        {!loading && !error && Object.keys(content).length === 0 ? (
          <EmptyState title="No editable content yet" description="Add content keys in the database to see them here." />
        ) : null}

        {!loading && !error && Object.keys(content).length > 0 ? (
          <div className="space-y-5">
            {content.announcement !== undefined ? (
              <ContentCard
                title="Announcement bar"
                description="The slim message shown above the navigation."
                dirty={dirtyKeys.includes("announcement")}
                onSave={() => void saveKey("announcement")}
                saving={savingKey === "announcement"}
              >
                <AnnouncementEditor
                  value={asStringMap(content.announcement)}
                  onChange={(value) => setSection("announcement", value)}
                />
              </ContentCard>
            ) : null}

            {textEditor("hero", "Homepage hero", "The main headline and introduction.", [
              { key: "headline", label: "Headline" },
              { key: "subtext", label: "Supporting text", textarea: true },
              { key: "primaryCta", label: "Primary button text" },
              { key: "secondaryCta", label: "Secondary button text" },
              { key: "image", label: "Hero image path", hint: "e.g. /images/hero-main.jpg" },
            ])}

            {textEditor("story", "Brand story", "The story section on the homepage and Our Story page.", [
              { key: "headline", label: "Headline" },
              { key: "body", label: "Body text", textarea: true },
              { key: "image", label: "Story image path" },
            ])}

            {textEditor("curated", "Curated collections note", "The strip explaining trusted supplier pieces.", [
              { key: "headline", label: "Headline" },
              { key: "body", label: "Body text", textarea: true },
            ])}

            {textEditor("measurements", "Made-to-fit section", "The measurement and alteration guidance block.", [
              { key: "headline", label: "Headline" },
              { key: "body", label: "Body text", textarea: true },
            ])}

            {content.awards !== undefined ? (
              <ContentCard
                title="Awards & recognition"
                description="Only show verified awards. Replace any placeholder text before launch."
                dirty={dirtyKeys.includes("awards")}
                onSave={() => void saveKey("awards")}
                saving={savingKey === "awards"}
              >
                <AwardsEditor
                  value={
                    Array.isArray(content.awards)
                      ? (content.awards as StringMap[])
                      : []
                  }
                  onChange={(value) => setSection("awards", value)}
                />
              </ContentCard>
            ) : null}

            {content.social !== undefined ? (
              <ContentCard
                title="Social links & gallery"
                description="Links and image paths used in the footer and social strip."
                dirty={dirtyKeys.includes("social")}
                onSave={() => void saveKey("social")}
                saving={savingKey === "social"}
              >
                <SocialEditor
                  value={asStringMap(content.social)}
                  onChange={(value) => setSection("social", value)}
                />
              </ContentCard>
            ) : null}

            {textEditor("contact", "Contact details", "Shown in the footer and contact page.", [
              { key: "email", label: "Email address" },
              { key: "phoneDisplay", label: "Phone (display)" },
              { key: "address", label: "Address", textarea: true },
              { key: "hours", label: "Opening hours" },
            ])}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ContentCard({
  title,
  description,
  dirty,
  onSave,
  saving,
  children,
}: {
  title: string;
  description: string;
  dirty: boolean;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminCard
      title={title}
      description={description}
      action={
        <div className="flex items-center gap-2">
          {dirty ? <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-700">Unsaved</span> : null}
          <SmallButton tone="primary" onClick={onSave} disabled={saving || !dirty}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save section"}
          </SmallButton>
        </div>
      }
    >
      {children}
    </AdminCard>
  );
}

function TextFieldGroup({
  fields,
  value,
  onChange,
}: {
  fields: TextField[];
  value: StringMap;
  onChange: (value: StringMap) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          hint={field.hint}
          className={field.textarea ? "sm:col-span-2" : undefined}
        >
          {field.textarea ? (
            <textarea
              className="field-hq min-h-24 py-2.5"
              value={value[field.key] ?? ""}
              onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            />
          ) : (
            <input
              className="field-hq"
              value={value[field.key] ?? ""}
              onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            />
          )}
          {field.key === "image" && value[field.key] ? (
            <img
              src={value[field.key]}
              alt="Preview"
              className="mt-2 h-24 w-full border border-border bg-cream/40 object-contain"
            />
          ) : null}
        </Field>
      ))}
    </div>
  );
}

function AnnouncementEditor({
  value,
  onChange,
}: {
  value: StringMap;
  onChange: (value: StringMap) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Message">
        <input
          className="field-hq"
          value={value.text ?? ""}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
        />
      </Field>
      <Field label="Link (optional)">
        <input
          className="field-hq"
          value={value.href ?? ""}
          onChange={(event) => onChange({ ...value, href: event.target.value })}
        />
      </Field>
      <div className="sm:col-span-2">
        <CheckRow
          label="Show the announcement bar"
          checked={value.enabled !== "false"}
          onChange={(checked) => onChange({ ...value, enabled: checked ? "true" : "false" })}
        />
      </div>
    </div>
  );
}

function AwardsEditor({
  value,
  onChange,
}: {
  value: StringMap[];
  onChange: (value: StringMap[]) => void;
}) {
  const rows = value.length > 0 ? value : [{ title: "", detail: "", year: "" }];
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_100px_auto]">
          <input
            className="field-hq h-9 text-[12px]"
            value={row.title ?? ""}
            onChange={(event) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, title: event.target.value } : r)))
            }
            placeholder="Award name"
            aria-label={`Award ${index + 1} name`}
          />
          <input
            className="field-hq h-9 text-[12px]"
            value={row.detail ?? ""}
            onChange={(event) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, detail: event.target.value } : r)))
            }
            placeholder="Details"
            aria-label={`Award ${index + 1} details`}
          />
          <input
            className="field-hq h-9 text-[12px]"
            value={row.year ?? ""}
            onChange={(event) =>
              onChange(rows.map((r, i) => (i === index ? { ...r, year: event.target.value } : r)))
            }
            placeholder="Year"
            aria-label={`Award ${index + 1} year`}
          />
          <SmallButton
            tone="danger"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            Remove
          </SmallButton>
        </div>
      ))}
      <SmallButton onClick={() => onChange([...rows, { title: "", detail: "", year: "" }])}>
        Add award
      </SmallButton>
    </div>
  );
}

function SocialEditor({
  value,
  onChange,
}: {
  value: StringMap;
  onChange: (value: StringMap) => void;
}) {
  const gallery = (value.gallery ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram URL">
          <input
            className="field-hq"
            value={value.instagram ?? ""}
            onChange={(event) => onChange({ ...value, instagram: event.target.value })}
          />
        </Field>
        <Field label="Facebook URL">
          <input
            className="field-hq"
            value={value.facebook ?? ""}
            onChange={(event) => onChange({ ...value, facebook: event.target.value })}
          />
        </Field>
        <Field label="Instagram handle">
          <input
            className="field-hq"
            value={value.instagramHandle ?? ""}
            onChange={(event) => onChange({ ...value, instagramHandle: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Gallery images" hint="One image path per line.">
        <textarea
          className="field-hq min-h-24 py-2.5"
          value={gallery.join("\n")}
          onChange={(event) => onChange({ ...value, gallery: event.target.value })}
          placeholder={"/images/gallery-1.jpg\n/images/gallery-2.jpg"}
        />
      </Field>
      {gallery.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {gallery.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt={`Gallery preview ${index + 1}`}
              className="h-20 w-full border border-border object-cover"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
