"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage, type FieldIssues } from "@/components/admin/api";
import { ImagePicker } from "@/components/admin/image-picker";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import {
  AdminCard,
  CheckRow,
  ConfirmDialog,
  Field,
  SmallButton,
} from "@/components/admin/ui";
import { productStatusOf } from "@/components/admin/status";
import { AVAILABILITY, AVAILABILITY_LABEL } from "@/lib/availability";
import type { AdminColor, AdminProduct, AdminVariant } from "@/lib/admin-types";
import type { AdminProductWrite } from "@/lib/admin-product";
import { PRODUCT_STATUS_LABEL } from "@/lib/admin-labels";

type Draft = AdminProductWrite;

const QUICK_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free size"];

function blankDraft(): Draft {
  return {
    name: "",
    slug: "",
    description: "",
    fabricDetails: "",
    careInstructions: "",
    categoryId: "",
    source: "HQ_ORIGINAL",
    price: 0,
    compareAtPrice: null,
    colors: [{ name: "", hex: "#302820" }],
    sizes: [],
    images: [],
    stock: 0,
    sizeNotes: "",
    badge: "",
    featured: false,
    visible: false,
    priceConfirmed: false,
    isEnquiryOnly: false,
    trackStock: true,
    availability: "IN_STOCK",
    customSizingAllowed: false,
    readyToDispatch: false,
    preorderAllowed: false,
    variants: [],
  };
}

function fromProduct(product: AdminProduct | null): Draft {
  if (!product) return blankDraft();
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    fabricDetails: product.fabricDetails ?? "",
    careInstructions: product.careInstructions ?? "",
    categoryId: product.categoryId,
    source: product.source,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    colors: product.colors.map((c: AdminColor) => ({ ...c })),
    sizes: [...product.sizes],
    images: [...product.images],
    stock: product.stock,
    sizeNotes: product.sizeNotes ?? "",
    badge: product.badge ?? "",
    featured: product.featured,
    visible: product.visible,
    priceConfirmed: product.priceConfirmed,
    isEnquiryOnly: product.isEnquiryOnly,
    trackStock: product.trackStock,
    availability: product.availability,
    customSizingAllowed: product.customSizingAllowed,
    readyToDispatch: product.readyToDispatch,
    preorderAllowed: product.preorderAllowed,
    variants: product.variants.map((v: AdminVariant) => ({
      ...(v.id ? { id: v.id } : {}),
      ...(v.sku !== undefined ? { sku: v.sku } : {}),
      size: v.size,
      color: v.color,
      stock: v.stock,
      extraPrice: v.extraPrice,
      isActive: v.isActive,
      lowStockThreshold: v.lowStockThreshold,
    })),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProductForm({
  product,
  categories,
  onSaved,
  onCancel,
}: {
  product: AdminProduct | "new" | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const initial = useMemo(() => fromProduct(product && product !== "new" ? product : null), [product]);
  const [draft, setDraft] = useState<Draft>(() => fromProduct(product && product !== "new" ? product : null));
  const [issues, setIssues] = useState<FieldIssues>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  useUnsavedChanges(dirty, "You have unsaved product changes. Leave without saving?");

  const isNew = product === "new" || !product;
  const status = productStatusOf({
    ...draft,
    catalogueBatch: product && product !== "new" ? product.catalogueBatch : null,
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setIssues((prev) => ({ ...prev, [key]: undefined }));
  };

  const setStatus = (next: string) => {
    setDraft((prev) => {
      if (next === "live") {
        return { ...prev, visible: true, isEnquiryOnly: false, priceConfirmed: true };
      }
      if (next === "hidden") {
        return { ...prev, visible: false, isEnquiryOnly: false, priceConfirmed: true };
      }
      if (next === "pending") {
        return { ...prev, visible: false, isEnquiryOnly: false, priceConfirmed: false };
      }
      return { ...prev, visible: true, isEnquiryOnly: true, priceConfirmed: false };
    });
  };

  const buildVariantGrid = () => {
    setDraft((prev) => {
      const existing = new Map(prev.variants.map((v) => [`${v.size}\u0000${v.color}`, v]));
      const variants: AdminVariant[] = [];
      for (const size of prev.sizes) {
        for (const color of prev.colors) {
          const key = `${size}\u0000${color.name}`;
          variants.push(
            existing.get(key) ?? {
              size,
              color: color.name,
              stock: 0,
              extraPrice: 0,
              isActive: true,
              lowStockThreshold: 2,
            }
          );
        }
      }
      return { ...prev, variants };
    });
  };

  const updateVariant = (index: number, patch: Partial<AdminVariant>) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const validate = (): FieldIssues => {
    const found: FieldIssues = {};
    if (draft.name.trim().length < 2) found.name = ["Enter a product name of at least 2 characters."];
    if (!draft.categoryId) found.categoryId = ["Choose a category."];
    if (draft.description.trim().length < 10) {
      found.description = ["Write at least 10 characters so customers know what they are buying."];
    }
    if (draft.images.length === 0) found.images = ["Add at least one photo."];
    // A hidden draft may be saved before sizes are decided. Sizes are only
    // mandatory when the product will actually be published for sale.
    if (draft.sizes.length === 0 && status === "live") {
      found.sizes = ["Add at least one size before publishing, or choose Enquiry only."];
    }
    if (draft.colors.length === 0 || draft.colors.some((c) => !c.name.trim() || !c.hex.trim())) {
      found.colors = ["Give every colour a name and pick a colour swatch."];
    }
    if (status === "live") {
      if (!draft.priceConfirmed) found.price = ["Confirm the selling price before publishing."];
      else if (draft.price <= 0) found.price = ["Enter a selling price above zero."];
    }
    if (draft.compareAtPrice !== null && draft.compareAtPrice !== undefined && draft.compareAtPrice <= 0) {
      found.compareAtPrice = ["Leave this empty or enter an amount above zero."];
    }
    const seen = new Set<string>();
    for (const row of draft.variants) {
      const key = `${row.size}\u0000${row.color}`;
      if (seen.has(key)) {
        found.variants = ["Each size and colour combination can appear only once."];
        break;
      }
      seen.add(key);
      if (row.stock < 0 || !Number.isInteger(row.stock)) {
        found.variants = ["Stock must be a whole number of 0 or more."];
        break;
      }
    }
    return found;
  };

  const save = async () => {
    const found = validate();
    if (Object.keys(found).length > 0) {
      setIssues(found);
      setError("Please fix the highlighted fields before saving.");
      return;
    }
    setIssues({});
    setError(null);
    setSaving(true);
    try {
      const payload: AdminProductWrite = {
        ...draft,
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        description: draft.description.trim(),
        sizeNotes: draft.sizeNotes?.trim() || null,
        badge: draft.badge?.trim() || "",
        fabricDetails: draft.fabricDetails?.trim() || "",
        careInstructions: draft.careInstructions?.trim() || "",
      };
      if (!payload.slug) {
        setIssues({ name: ["Enter a name so a web address can be created."] });
        setError("Enter a product name first.");
        setSaving(false);
        return;
      }
      await adminFetch<{ ok: boolean }>(
        isNew ? "/api/admin/products" : `/api/admin/products/${(product as AdminProduct).id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) }
      );
      toast({
        title: isNew ? "Product added" : "Product saved",
        description: draft.visible
          ? "The product is live on the website."
          : "The product is saved and hidden from customers.",
      });
      onSaved();
    } catch (err) {
      const apiError = err as { issues?: FieldIssues };
      if (apiError.issues) setIssues(apiError.issues);
      setError(errorMessage(err, "The product could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const requestCancel = () => {
    if (dirty) setConfirmDiscard(true);
    else onCancel();
  };

  return (
    <div className="space-y-5">
      {error ? (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12.5px] text-destructive">
          {error}
        </div>
      ) : null}

      <AdminCard
        title="The basics"
        description="What customers will see first. You can save this as hidden and finish the rest later."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" required error={issues.name?.[0]}>
            <input
              className="field-hq"
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((prev) => ({
                  ...prev,
                  name,
                  slug: isNew ? slugify(name) : prev.slug,
                }));
              }}
              placeholder="e.g. Embroidered Occasion Abaya"
            />
          </Field>
          <Field
            label="Web address"
            hint="Lowercase letters, numbers and hyphens only."
            error={issues.slug?.[0]}
            required
          >
            <input
              className="field-hq"
              value={draft.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="embroidered-occasion-abaya"
            />
          </Field>
          <Field label="Category" required error={issues.categoryId?.[0]}>
            <select
              className="field-hq"
              value={draft.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Where it comes from" hint="Internal only — never shown to customers.">
            <select
              className="field-hq"
              value={draft.source}
              onChange={(e) => set("source", e.target.value as Draft["source"])}
            >
              <option value="HQ_ORIGINAL">Haji Queens original</option>
              <option value="TRUSTED_SUPPLIER">Trusted supplier catalogue</option>
            </select>
          </Field>
          <Field
            label="Selling price (₹)"
            required={status === "live"}
            hint={draft.isEnquiryOnly ? "Enquiry-only products are shown without a price." : undefined}
            error={issues.price?.[0]}
          >
            <input
              type="number"
              min="0"
              step="1"
              className="field-hq"
              value={draft.price}
              onChange={(e) => set("price", toNumber(e.target.value))}
            />
          </Field>
          <Field label="Compare-at price (₹)" hint="Optional. Leave empty if there is no offer." error={issues.compareAtPrice?.[0]}>
            <input
              type="number"
              min="0"
              step="1"
              className="field-hq"
              value={draft.compareAtPrice ?? ""}
              onChange={(e) => set("compareAtPrice", e.target.value === "" ? null : toNumber(e.target.value))}
            />
          </Field>
          <Field label="Product state" hint="Pending approval stays hidden until a price is confirmed.">
            <select className="field-hq" value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Badge" hint="Optional, e.g. New In or Bestseller." error={issues.badge?.[0]}>
            <input
              className="field-hq"
              value={draft.badge ?? ""}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="New In"
            />
          </Field>
        </div>
        <div className="mt-4">
          <CheckRow
            label="Feature this product on the homepage"
            checked={draft.featured}
            onChange={(checked) => set("featured", checked)}
          />
        </div>
      </AdminCard>

      <AdminCard title="Description and fitting" description="Plain language helps customers choose correctly the first time.">
        <div className="space-y-4">
          <Field label="Description" required error={issues.description?.[0]}>
            <textarea
              className="field-hq min-h-28 py-2.5"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the cut, fabric, occasion and what is included."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fabric details">
              <input
                className="field-hq"
                value={draft.fabricDetails ?? ""}
                onChange={(e) => set("fabricDetails", e.target.value)}
                placeholder="e.g. Nida matte with embroidered dupatta"
              />
            </Field>
            <Field label="Care instructions">
              <input
                className="field-hq"
                value={draft.careInstructions ?? ""}
                onChange={(e) => set("careInstructions", e.target.value)}
                placeholder="e.g. Dry clean only"
              />
            </Field>
          </div>
          <Field
            label="Size notes / measurement prompts"
            hint="Shown to customers when custom sizing is enabled."
            error={issues.sizeNotes?.[0]}
          >
            <textarea
              className="field-hq min-h-20 py-2.5"
              value={draft.sizeNotes ?? ""}
              onChange={(e) => set("sizeNotes", e.target.value)}
              placeholder="e.g. Please share bust, waist, hip and preferred length."
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard
        title="Product photos"
        description="Drag to reorder. The first photo is the main image on the website."
      >
        <ImagePicker value={draft.images} onChange={(images) => set("images", images)} />
        {issues.images?.[0] ? <p className="mt-2 text-[11.5px] text-destructive">{issues.images[0]}</p> : null}
      </AdminCard>

      <AdminCard title="Sizes and colours" description="These options become the stock rows your customers choose from.">
        <div className="space-y-5">
          <div>
            <p className="field-label">Available sizes</p>
            <input
              className="field-hq"
              value={draft.sizes.join(", ")}
              onChange={(e) =>
                set(
                  "sizes",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="S, M, L, XL"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_SIZES.map((size) => {
                const active = draft.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      set(
                        "sizes",
                        active ? draft.sizes.filter((s) => s !== size) : [...draft.sizes, size]
                      )
                    }
                    className={`border px-2.5 py-1 text-[11px] ${
                      active
                        ? "border-espresso bg-espresso text-ivory"
                        : "border-border text-espresso/70 hover:border-gold"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {issues.sizes?.[0] ? <p className="mt-1 text-[11.5px] text-destructive">{issues.sizes[0]}</p> : null}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="field-label">Colours</p>
              <SmallButton
                onClick={() =>
                  set("colors", [...draft.colors, { name: "", hex: "#302820" }])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add colour
              </SmallButton>
            </div>
            <div className="mt-2 space-y-2">
              {draft.colors.map((color, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                  <input
                    className="field-hq h-9 text-[12px]"
                    value={color.name}
                    onChange={(e) =>
                      set(
                        "colors",
                        draft.colors.map((c, i) => (i === index ? { ...c, name: e.target.value } : c))
                      )
                    }
                    placeholder="Colour name"
                    aria-label={`Colour ${index + 1} name`}
                  />
                  <input
                    type="color"
                    className="h-9 w-10 cursor-pointer border border-border bg-white p-1"
                    value={color.hex}
                    onChange={(e) =>
                      set(
                        "colors",
                        draft.colors.map((c, i) => (i === index ? { ...c, hex: e.target.value } : c))
                      )
                    }
                    aria-label={`Colour ${index + 1} swatch`}
                  />
                  <input
                    className="field-hq h-9 text-[12px]"
                    value={color.hex2 ?? ""}
                    onChange={(e) =>
                      set(
                        "colors",
                        draft.colors.map((c, i) =>
                          i === index ? { ...c, hex2: e.target.value || undefined } : c
                        )
                      )
                    }
                    placeholder="Second tone (optional)"
                    aria-label={`Colour ${index + 1} second tone`}
                  />
                  <button
                    type="button"
                    onClick={() => set("colors", draft.colors.filter((_, i) => i !== index))}
                    className="inline-flex h-9 w-9 items-center justify-center border border-border text-taupe hover:border-destructive hover:text-destructive"
                    aria-label={`Remove colour ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {issues.colors?.[0] ? <p className="mt-1 text-[11.5px] text-destructive">{issues.colors[0]}</p> : null}
          </div>

          <div className="border border-border bg-cream/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-semibold text-espresso">Stock options grid</p>
                <p className="mt-0.5 text-[11px] text-taupe">
                  One row per size and colour. Extra charge is added to the selling price for that option.
                </p>
              </div>
              <SmallButton onClick={buildVariantGrid} tone="primary">
                Build option rows
              </SmallButton>
            </div>
            {issues.variants?.[0] ? (
              <p className="mt-2 text-[11.5px] text-destructive">{issues.variants[0]}</p>
            ) : null}

            {draft.variants.length === 0 ? (
              <p className="mt-4 border border-dashed border-border bg-white px-4 py-6 text-center text-[12px] text-taupe">
                No option rows yet. Choose your sizes and colours, then select “Build option rows”.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto border border-border bg-white">
                <table className="w-full min-w-[720px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-cream/40 text-[10px] uppercase tracking-[0.12em] text-taupe">
                      <th className="px-3 py-2.5 font-semibold">Size</th>
                      <th className="px-3 py-2.5 font-semibold">Colour</th>
                      <th className="px-3 py-2.5 font-semibold">Sellable stock</th>
                      <th className="px-3 py-2.5 font-semibold">Extra charge (₹)</th>
                      <th className="px-3 py-2.5 font-semibold">Low-stock alert</th>
                      <th className="px-3 py-2.5 font-semibold">Active</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.variants.map((row, index) => (
                      <tr key={`${row.size}-${row.color}-${index}`} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2">
                          <input
                            className="field-hq h-8 w-20 text-[12px]"
                            value={row.size}
                            onChange={(e) => updateVariant(index, { size: e.target.value.trim() })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="field-hq h-8 w-28 text-[12px]"
                            value={row.color}
                            onChange={(e) => updateVariant(index, { color: e.target.value.trim() })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            className="field-hq h-8 w-20 text-[12px]"
                            value={row.stock}
                            onChange={(e) => updateVariant(index, { stock: Math.max(0, Math.trunc(toNumber(e.target.value))) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="field-hq h-8 w-24 text-[12px]"
                            value={row.extraPrice}
                            onChange={(e) => updateVariant(index, { extraPrice: Math.max(0, toNumber(e.target.value)) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            className="field-hq h-8 w-20 text-[12px]"
                            value={row.lowStockThreshold}
                            onChange={(e) =>
                              updateVariant(index, {
                                lowStockThreshold: Math.max(0, Math.trunc(toNumber(e.target.value))),
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                            className="h-4 w-4 accent-gold"
                            aria-label={`${row.size} ${row.color} active`}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "variants",
                                draft.variants.filter((_, i) => i !== index)
                              )
                            }
                            className="p-1 text-taupe hover:text-destructive"
                            aria-label={`Remove ${row.size} ${row.color}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Availability" description="Choose how this product is sold. Stock quantities stay on the option rows above.">
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckRow
            label="Track exact stock quantities"
            hint="Turn off only when quantities are not known; the availability label below will decide whether customers can order."
            checked={draft.trackStock}
            onChange={(checked) => set("trackStock", checked)}
          />
          <Field
            label="Availability label"
            hint={draft.trackStock ? "Used as a display note when exact stock is tracked." : "Decides whether customers can order."}
          >
            <select
              className="field-hq"
              value={draft.availability}
              onChange={(e) => set("availability", e.target.value as Draft["availability"])}
            >
              {AVAILABILITY.map((value) => (
                <option key={value} value={value}>
                  {AVAILABILITY_LABEL[value]}
                </option>
              ))}
            </select>
          </Field>
          <CheckRow
            label="Enquiry only"
            hint="Show the product without a price and send customers to the measurement form."
            checked={draft.isEnquiryOnly}
            onChange={(checked) => setStatus(checked ? "enquiry" : "hidden")}
          />
          <CheckRow
            label="Allow custom sizing"
            hint="Show the size notes and measurement prompts on the website."
            checked={draft.customSizingAllowed}
            onChange={(checked) => set("customSizingAllowed", checked)}
          />
          <CheckRow
            label="Ready to dispatch"
            hint="Mark pieces already made and available to ship."
            checked={draft.readyToDispatch}
            onChange={(checked) => set("readyToDispatch", checked)}
          />
          <CheckRow
            label="Accept pre-orders"
            hint="Allow orders when the next batch is on the way."
            checked={draft.preorderAllowed}
            onChange={(checked) => set("preorderAllowed", checked)}
          />
        </div>
      </AdminCard>

      {product && product !== "new" ? (
        <AdminCard title="Internal notes" description="Supplier costs and review notes are not shown on the website.">
          {product.supplierEntry ? (
            <p className="text-[12.5px] text-espresso/75">
              Supplier: <strong>{product.supplierEntry.supplierName}</strong> · Internal cost ₹
              {product.supplierEntry.wholesalePrice.toLocaleString("en-IN")} · Markup{" "}
              {product.supplierEntry.markupPct}%
            </p>
          ) : (
            <p className="text-[12.5px] text-taupe">No linked supplier entry.</p>
          )}
          {product.reviewNotes.length > 0 ? (
            <ul className="mt-3 space-y-1 text-[12px] text-espresso/70">
              {product.reviewNotes.map((note, i) => (
                <li key={i}>
                  <span className="font-semibold">{note.field}:</span> {note.note}
                </li>
              ))}
            </ul>
          ) : null}
        </AdminCard>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <SmallButton onClick={requestCancel} disabled={saving}>
          Cancel
        </SmallButton>
        <SmallButton onClick={() => void save()} disabled={saving} tone="primary">
          {saving ? "Saving…" : <Save className="h-3.5 w-3.5" />}
          {isNew ? "Add product" : "Save changes"}
        </SmallButton>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard product changes?"
        description="Your edits to this product have not been saved."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
