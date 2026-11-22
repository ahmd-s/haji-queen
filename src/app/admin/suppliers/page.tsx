"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatINR, computeRetail } from "@/lib/money";

type Entry = {
  id: string;
  supplierId: string;
  supplierRef: string | null;
  itemName: string;
  wholesalePrice: number;
  markupPct: number;
  fixedMarkup: number;
  availability: string;
  notes: string | null;
  product?: { slug: string; price: number; name: string } | null;
};

type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  catalogName: string | null;
  notes: string | null;
  isActive: boolean;
  catalogueEntries: Entry[];
};

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [entryFor, setEntryFor] = useState<Supplier | null>(null);

  const load = async () => {
    const d = await fetch("/api/admin/suppliers").then((r) => r.json());
    setSuppliers(d.suppliers ?? []);
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Internal</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Suppliers &amp; Margins</h1>
          <p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-taupe">
            Wholesale costs and markups are private business data — they are never shown on the
            storefront or exposed by public APIs. Customers see only the final retail price.
          </p>
        </div>
        <button onClick={() => setAddingSupplier(true)} className="btn-hq-primary !px-5 !py-2.5">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-taupe">Loading suppliers…</p>
      ) : suppliers.length === 0 ? (
        <p className="mt-8 border border-border bg-white p-6 text-[13px] text-taupe">
          No suppliers yet. Add your first supplier, then create catalogue entries with wholesale
          pricing and markups.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {suppliers.map((s) => (
            <div key={s.id} className="border border-border bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-cream/30 px-5 py-4">
                <div>
                  <h2 className="font-display text-xl text-espresso">{s.name}</h2>
                  <p className="mt-0.5 text-[12px] text-taupe">
                    {s.contactPerson && <>{s.contactPerson} · </>}
                    {s.phone && <>{s.phone} · </>}
                    {s.email}
                  </p>
                  {s.catalogName && (
                    <p className="mt-0.5 text-[12px] italic text-taupe">Catalogue: {s.catalogName}</p>
                  )}
                  {s.notes && <p className="mt-1 max-w-xl text-[11.5px] text-espresso/55">{s.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEntryFor(s)} className="btn-hq-outline !px-4 !py-2 !text-[11px]">
                    <Plus className="h-3.5 w-3.5" /> Catalogue Entry
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete supplier "${s.name}"?`)) return;
                      const res = await fetch(`/api/admin/suppliers/${s.id}`, { method: "DELETE" });
                      const d = await res.json();
                      if (!res.ok) toast({ title: d.error ?? "Delete failed" });
                      else {
                        toast({ title: "Supplier deleted" });
                        load();
                      }
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center border border-border text-taupe hover:border-destructive hover:text-destructive"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {s.catalogueEntries.length === 0 ? (
                <p className="px-5 py-4 text-[12.5px] text-taupe">No catalogue entries yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border text-[10.5px] uppercase tracking-[0.14em] text-taupe">
                        <th className="px-5 py-2.5 font-semibold">Item</th>
                        <th className="px-4 py-2.5 font-semibold">Ref</th>
                        <th className="px-4 py-2.5 font-semibold">Wholesale</th>
                        <th className="px-4 py-2.5 font-semibold">Markup</th>
                        <th className="px-4 py-2.5 font-semibold">Suggested Retail</th>
                        <th className="px-4 py-2.5 font-semibold">Linked Product</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.catalogueEntries.map((e) => {
                        const suggested = computeRetail(e.wholesalePrice, e.markupPct, e.fixedMarkup);
                        return (
                          <tr key={e.id} className="border-b border-border last:border-0">
                            <td className="px-5 py-3 font-medium text-espresso">{e.itemName}</td>
                            <td className="px-4 py-3 text-espresso/70">{e.supplierRef ?? "—"}</td>
                            <td className="px-4 py-3 text-espresso/80">
                              {formatINR(e.wholesalePrice)}
                            </td>
                            <td className="px-4 py-3 text-espresso/80">
                              {e.markupPct}%
                              {e.fixedMarkup > 0 && <> + {formatINR(e.fixedMarkup)}</>}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gold-deep">
                              {formatINR(suggested)}
                            </td>
                            <td className="px-4 py-3 text-[12px]">
                              {e.product ? (
                                <>
                                  <span className="text-espresso/80">{e.product.name}</span>
                                  <br />
                                  <span className="text-taupe">retail {formatINR(e.product.price)}</span>
                                </>
                              ) : (
                                <span className="text-taupe">Not linked — add in Products</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={async () => {
                                  if (!confirm(`Remove catalogue entry "${e.itemName}"?`)) return;
                                  const res = await fetch(`/api/admin/suppliers/entries/${e.id}`, {
                                    method: "DELETE",
                                  });
                                  if (res.ok) {
                                    toast({ title: "Entry removed" });
                                    load();
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center border border-border text-taupe hover:border-destructive hover:text-destructive"
                                aria-label={`Remove ${e.itemName}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Margin calculator explainer */}
      <div className="mt-8 flex items-start gap-3 border border-border bg-champagne/25 p-5 text-[12.5px] leading-relaxed text-espresso/75">
        <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
        <p>
          <strong className="text-espresso">How pricing works:</strong> suggested retail =
          wholesale × (1 + markup %) + fixed markup, rounded up. Example — wholesale ₹1,000 at 30%
          → ₹1,300. Set the product&rsquo;s retail price in Products to the suggested value (or
          adjust it — the storefront only ever shows retail).
        </p>
      </div>

      {addingSupplier && (
        <SupplierForm
          onClose={() => setAddingSupplier(false)}
          onSaved={() => {
            setAddingSupplier(false);
            load();
          }}
        />
      )}
      {entryFor && (
        <EntryForm
          supplier={entryFor}
          onClose={() => setEntryFor(null)}
          onSaved={() => {
            setEntryFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SupplierForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    catalogName: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Supplier added" });
      onSaved();
    } else {
      const d = await res.json();
      toast({ title: d.error ?? "Save failed" });
    }
  };

  return (
    <Modal title="Add Supplier" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Supplier name *</label>
          <input className="field-hq" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="field-label">Contact person</label>
          <input className="field-hq" value={form.contactPerson} onChange={set("contactPerson")} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="field-hq" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-hq" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="field-label">Catalogue name</label>
          <input className="field-hq" value={form.catalogName} onChange={set("catalogName")} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Internal notes</label>
          <textarea className="field-hq h-20 py-2.5" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button onClick={onClose} className="btn-hq-outline !px-5 !py-2.5">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-hq-primary !px-6 !py-2.5">
          {saving ? "Saving…" : "Add Supplier"}
        </button>
      </div>
    </Modal>
  );
}

function EntryForm({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    itemName: "",
    supplierRef: "",
    wholesalePrice: 0,
    markupPct: 30,
    fixedMarkup: 0,
    availability: "AVAILABLE",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const suggested = useMemo(
    () => computeRetail(Number(form.wholesalePrice) || 0, Number(form.markupPct) || 0, Number(form.fixedMarkup) || 0),
    [form.wholesalePrice, form.markupPct, form.fixedMarkup]
  );

  const save = async () => {
    if (!form.itemName.trim() || !(form.wholesalePrice > 0)) {
      toast({ title: "Item name and wholesale price are required" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/suppliers/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, supplierId: supplier.id }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: d.error ?? "Save failed" });
      return;
    }
    toast({ title: "Entry added", description: `Suggested retail ${formatINR(d.suggestedRetail)}` });
    onSaved();
  };

  return (
    <Modal title={`Catalogue Entry — ${supplier.name}`} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Item name *</label>
          <input className="field-hq" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Supplier product reference</label>
          <input className="field-hq" value={form.supplierRef} onChange={(e) => setForm((f) => ({ ...f, supplierRef: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Wholesale price (₹) *</label>
          <input type="number" className="field-hq" value={form.wholesalePrice || ""} onChange={(e) => setForm((f) => ({ ...f, wholesalePrice: Number(e.target.value) }))} min={1} />
        </div>
        <div>
          <label className="field-label">Markup %</label>
          <input type="number" className="field-hq" value={form.markupPct} onChange={(e) => setForm((f) => ({ ...f, markupPct: Number(e.target.value) }))} min={0} />
        </div>
        <div>
          <label className="field-label">Fixed markup (₹)</label>
          <input type="number" className="field-hq" value={form.fixedMarkup} onChange={(e) => setForm((f) => ({ ...f, fixedMarkup: Number(e.target.value) }))} min={0} />
        </div>
        <div>
          <label className="field-label">Availability</label>
          <select className="field-hq" value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}>
            <option value="AVAILABLE">Available</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Internal notes</label>
          <textarea className="field-hq h-20 py-2.5" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 border border-gold/40 bg-champagne/25 p-4">
        <p className="text-[13px] text-espresso/80">
          Suggested retail:{" "}
          <span className="font-display text-2xl font-semibold text-gold-deep">
            {formatINR(suggested)}
          </span>
          <span className="ml-2 text-[11.5px] text-taupe">
            ({formatINR(form.wholesalePrice)} + {form.markupPct}% + {formatINR(form.fixedMarkup)}, rounded up)
          </span>
        </p>
      </div>
      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button onClick={onClose} className="btn-hq-outline !px-5 !py-2.5">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-hq-primary !px-6 !py-2.5">
          {saving ? "Saving…" : "Add Entry"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-espresso/50 p-4 py-10">
      <div className="w-full max-w-2xl bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-2xl text-espresso">{title}</h2>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center hover:text-gold" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
