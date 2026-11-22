"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  PackageX,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

type AdminProduct = {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  fabricDetails: string | null;
  careInstructions: string | null;
  categoryId: string;
  categoryName: string;
  source: "HQ_ORIGINAL" | "TRUSTED_SUPPLIER";
  price: number;
  compareAtPrice: number | null;
  colors: { name: string; hex: string }[];
  sizes: string[];
  images: string[];
  badge: string | null;
  featured: boolean;
  visible: boolean;
  stock: number;
  supplierEntry: { supplierName: string; wholesalePrice: number; markupPct: number } | null;
};

type Category = { id: string; name: string; slug: string };

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  fabricDetails: "",
  careInstructions: "",
  categoryId: "",
  source: "HQ_ORIGINAL" as const,
  price: 0,
  compareAtPrice: null as number | null,
  colors: [{ name: "Onyx Black", hex: "#1d1a17" }],
  sizes: ["S", "M", "L"],
  images: [] as string[],
  badge: "",
  featured: false,
  visible: true,
  stock: 10,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "pending" | "hidden">("all");

  /** A product is "pending approval" while hidden AND missing essentials
   *  (selling price or images) — e.g. freshly imported catalogue rows. */
  const needsApproval = (p: AdminProduct) => !p.visible && (p.price <= 0 || p.images.length === 0);

  const visibleProducts = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => {
      if (filter === "live") return p.visible;
      if (filter === "pending") return needsApproval(p);
      return !p.visible && !needsApproval(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filter]);

  const patchProduct = async (p: AdminProduct, patch: Partial<AdminProduct>, okTitle: string) => {
    const body = {
      name: p.name,
      slug: p.slug,
      description: p.description,
      fabricDetails: p.fabricDetails ?? "",
      careInstructions: p.careInstructions ?? "",
      categoryId: p.categoryId,
      source: p.source,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      colors: p.colors,
      sizes: p.sizes,
      images: p.images,
      badge: p.badge ?? "",
      featured: p.featured,
      visible: p.visible,
      stock: p.stock,
      ...patch,
    };
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) {
      toast({ title: d.error ?? "Update failed" });
      return false;
    }
    toast({ title: okTitle });
    load();
    return true;
  };

  const toggleVisible = async (p: AdminProduct) => {
    if (!p.visible && needsApproval(p)) {
      toast({
        title: "Cannot publish — pending approval",
        description: p.price <= 0
          ? "Set the customer selling price first."
          : "Upload at least one product image first.",
      });
      return;
    }
    await patchProduct(p, { visible: !p.visible }, p.visible ? "Product unpublished" : "Product published");
  };

  const toggleStock = async (p: AdminProduct) => {
    if (p.stock > 0) {
      if (!confirm(`Mark "${p.name}" as out of stock (0 units)?`)) return;
      await patchProduct(p, { stock: 0 }, "Marked out of stock");
    } else {
      const raw = prompt(`Restock quantity for "${p.name}":`, "10");
      const qty = raw ? Number.parseInt(raw, 10) : NaN;
      if (!raw || Number.isNaN(qty) || qty < 0) return;
      await patchProduct(p, { stock: qty }, `Stock updated to ${qty}`);
    }
  };

  const load = async () => {
    const p = await fetch("/api/admin/products").then((r) => r.json());
    setProducts(p.products ?? []);
    const catRes = await fetch("/api/admin/categories").catch(() => null);
    if (catRes?.ok) {
      const cd = await catRes.json();
      setCategories(cd.categories ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern
    load();
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Catalogue</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Products</h1>
        </div>
        <button onClick={() => setEditing("new")} className="btn-hq-primary !px-5 !py-2.5">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([
          ["all", "All"],
          ["live", "Live"],
          ["pending", "Pending approval"],
          ["hidden", "Hidden"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "h-8 border px-3 text-[12px] font-medium",
              filter === key ? "border-espresso bg-espresso text-ivory" : "border-border text-espresso/70 hover:border-gold"
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-1 text-[11.5px] text-taupe">
          {visibleProducts.length} of {products.length} shown
        </span>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-taupe">Loading products…</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-white">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-cream/40 text-[11px] uppercase tracking-[0.14em] text-taupe">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Flags</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-cream">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-espresso">{p.name}</p>
                        <p className="text-[11.5px] text-taupe">/{p.slug}</p>
                        {p.sku && <p className="text-[11px] text-taupe/80">SKU {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-espresso/80">{p.categoryName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        p.source === "HQ_ORIGINAL"
                          ? "bg-champagne text-gold-deep"
                          : "bg-espresso/10 text-espresso"
                      )}
                    >
                      {p.source === "HQ_ORIGINAL" ? "Original" : "Supplier"}
                    </span>
                    {p.supplierEntry && (
                      <p className="mt-1 text-[10.5px] text-taupe">
                        {p.supplierEntry.supplierName} · cost ₹{p.supplierEntry.wholesalePrice.toLocaleString("en-IN")} · +{p.supplierEntry.markupPct}%
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-espresso">{formatINR(p.price)}</td>
                  <td className="px-4 py-3 text-espresso/80">{p.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.featured && (
                        <span className="bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gold-deep">Featured</span>
                      )}
                      {needsApproval(p) && (
                        <span className="border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gold-deep">
                          Pending approval
                        </span>
                      )}
                      {!p.visible && (
                        <span className="bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">Hidden</span>
                      )}
                      {p.visible && p.stock === 0 && (
                        <span className="bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">Out of stock</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => toggleVisible(p)}
                        className="inline-flex h-8 w-8 items-center justify-center border border-border text-espresso hover:border-gold hover:text-gold"
                        aria-label={p.visible ? `Unpublish ${p.name}` : `Publish ${p.name}`}
                        title={p.visible ? "Unpublish" : "Publish"}
                      >
                        {p.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleStock(p)}
                        className="inline-flex h-8 w-8 items-center justify-center border border-border text-espresso hover:border-gold hover:text-gold"
                        aria-label={p.stock > 0 ? `Mark ${p.name} out of stock` : `Restock ${p.name}`}
                        title={p.stock > 0 ? "Mark out of stock" : "Restock"}
                      >
                        {p.stock > 0 ? <PackageX className="h-3.5 w-3.5" /> : <PackagePlus className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditing(p)}
                        className="inline-flex h-8 w-8 items-center justify-center border border-border text-espresso hover:border-gold hover:text-gold"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
                          const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
                          const d = await res.json();
                          if (!res.ok) toast({ title: d.error ?? "Delete failed" });
                          else {
                            toast({ title: "Product deleted" });
                            load();
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center border border-border text-taupe hover:border-destructive hover:text-destructive"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          fabricDetails: product.fabricDetails ?? "",
          careInstructions: product.careInstructions ?? "",
          categoryId: product.categoryId,
          source: product.source,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          colors: product.colors.length ? product.colors : [{ name: "Black", hex: "#1d1a17" }],
          sizes: product.sizes.length ? product.sizes : ["M"],
          images: product.images,
          badge: product.badge ?? "",
          featured: product.featured,
          visible: product.visible,
          stock: product.stock,
        }
      : { ...EMPTY, categoryId: categories[0]?.id ?? "" }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Upload failed.");
      } else {
        set("images", [...form.images, ...(d.urls ?? [])]);
        toast({
          title: `${d.urls?.length ?? 0} image(s) uploaded`,
          description: d.errors?.length ? `Skipped: ${d.errors.join(" ")}` : undefined,
        });
      }
    } catch {
      setError("Upload failed — please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setError(null);
    const problems: string[] = [];
    if (!form.name.trim()) problems.push("a name");
    if (form.description.trim().length < 10) problems.push("a description (10+ characters)");
    if (!form.categoryId) problems.push("a category");
    if (form.visible) {
      // Publish guard mirrors the server: visible products must be complete.
      if (form.price <= 0)
        problems.push("a selling price above ₹0 (or untick “Visible in store” while the price is pending)");
      if (form.images.length === 0)
        problems.push("at least one product image (or untick “Visible in store” while photos are pending)");
    }
    if (problems.length) {
      setError("Required: " + problems.join(", ") + ".");
      return;
    }
    setSaving(true);
    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, badge: form.badge || undefined }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(d.error ?? "Save failed.");
      return;
    }
    toast({ title: product ? "Product updated" : "Product created" });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-espresso/50 p-4 py-10">
      <div className="w-full max-w-3xl bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-2xl text-espresso">
              {product ? "Edit Product" : "Add Product"}
            </h2>
            {product?.sku && (
              <p className="mt-0.5 text-[11.5px] text-taupe">
                SKU {product.sku}
                {product.price <= 0 && " · price pending approval — save hidden until confirmed"}
                {product.price > 0 && product.images.length === 0 && " · image pending upload"}
              </p>
            )}
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center hover:text-gold" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Name *</label>
              <input className="field-hq" value={form.name} onChange={(e) => { set("name", e.target.value); if (!product) set("slug", slugify(e.target.value)); }} />
            </div>
            <div>
              <label className="field-label">Slug *</label>
              <input className="field-hq" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Description *</label>
              <textarea className="field-hq h-24 py-2.5" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Fabric details</label>
              <input className="field-hq" value={form.fabricDetails} onChange={(e) => set("fabricDetails", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Care instructions</label>
              <input className="field-hq" value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Category *</label>
              <select className="field-hq" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Product source *</label>
              <select className="field-hq" value={form.source} onChange={(e) => set("source", e.target.value as "HQ_ORIGINAL" | "TRUSTED_SUPPLIER")}>
                <option value="HQ_ORIGINAL">Haji Queens Original</option>
                <option value="TRUSTED_SUPPLIER">Trusted Supplier Catalogue</option>
              </select>
            </div>
            <div>
              <label className="field-label">Retail price (₹) *</label>
              <input type="number" className="field-hq" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} min={1} />
            </div>
            <div>
              <label className="field-label">Compare-at price (₹, optional)</label>
              <input type="number" className="field-hq" value={form.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} min={1} />
            </div>
            <div>
              <label className="field-label">Total stock *</label>
              <input type="number" className="field-hq" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} min={0} />
            </div>
            <div>
              <label className="field-label">Badge (optional)</label>
              <input className="field-hq" value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="New In / Bestseller" />
            </div>
          </div>

          {/* Colours */}
          <div>
            <label className="field-label">Colours (name + hex)</label>
            <div className="space-y-2">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="field-hq flex-1"
                    value={c.name}
                    onChange={(e) => {
                      const colors = [...form.colors];
                      colors[i] = { ...c, name: e.target.value };
                      set("colors", colors);
                    }}
                    placeholder="Colour name"
                  />
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => {
                      const colors = [...form.colors];
                      colors[i] = { ...c, hex: e.target.value };
                      set("colors", colors);
                    }}
                    className="h-11 w-12 cursor-pointer border border-input bg-white p-1"
                    aria-label="Colour swatch"
                  />
                  <button
                    onClick={() => set("colors", form.colors.filter((_, j) => j !== i))}
                    className="inline-flex h-9 w-9 items-center justify-center text-taupe hover:text-destructive"
                    aria-label="Remove colour"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => set("colors", [...form.colors, { name: "", hex: "#b58a36" }])}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold hover:underline"
              >
                + Add colour
              </button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="field-label">Available sizes</label>
            <div className="flex flex-wrap gap-2">
              {["XS", "S", "M", "L", "XL", "XXL", "Free Size"].map((s) => {
                const active = form.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      set("sizes", active ? form.sizes.filter((x) => x !== s) : [...form.sizes, s])
                    }
                    className={cn(
                      "h-9 min-w-11 border px-2.5 text-[12.5px] font-medium",
                      active ? "border-espresso bg-espresso text-ivory" : "border-border text-espresso/75"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="field-label">Images (paths or URLs, first = main)</label>
            <div className="space-y-2">
              {form.images.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-cream">
                    {img.startsWith("/") || img.startsWith("http") ? (
                      <Image src={img} alt="" fill sizes="40px" className="object-cover" unoptimized={img.startsWith("http")} />
                    ) : null}
                  </div>
                  <input
                    className="field-hq flex-1"
                    value={img}
                    onChange={(e) => {
                      const images = [...form.images];
                      images[i] = e.target.value;
                      set("images", images);
                    }}
                  />
                  <button
                    onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                    className="inline-flex h-9 w-9 items-center justify-center text-taupe hover:text-destructive"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-hq-outline !px-4 !py-2 !text-[12px] disabled:opacity-60"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Upload images"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files)}
                />
                <button
                  onClick={() => set("images", [...form.images, "/images/p-"])}
                  className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold hover:underline"
                >
                  + Add image path
                </button>
                <span className="text-[11.5px] text-taupe">
                  JPG/PNG/WEBP up to 8 MB each — originals are stored untouched; first image = main.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] text-espresso">
              <input type="checkbox" className="h-4 w-4 accent-[#b58a36]" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-[13px] text-espresso">
              <input type="checkbox" className="h-4 w-4 accent-[#b58a36]" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} />
              Visible in store
            </label>
          </div>

          {error && (
            <p className="border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <button onClick={onClose} className="btn-hq-outline !px-5 !py-2.5">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-hq-primary !px-6 !py-2.5">
              {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
