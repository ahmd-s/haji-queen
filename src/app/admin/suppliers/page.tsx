"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import {
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminTableScroll,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  SmallButton,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import { computeRetail, formatINR } from "@/lib/money";

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

type DeleteTarget =
  | { kind: "supplier"; id: string; name: string }
  | { kind: "entry"; id: string; name: string };

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [entryFor, setEntryFor] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ suppliers: Supplier[] }>("/api/admin/suppliers");
      setSuppliers(data.suppliers ?? []);
    } catch (err) {
      setError(errorMessage(err, "Suppliers could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const url =
        deleteTarget.kind === "supplier"
          ? `/api/admin/suppliers/${deleteTarget.id}`
          : `/api/admin/suppliers/entries/${deleteTarget.id}`;
      await adminFetch(url, { method: "DELETE" });
      toast({
        title: deleteTarget.kind === "supplier" ? "Supplier deleted" : "Catalogue entry removed",
      });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast({ title: "Could not delete", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Internal"
        title="Suppliers & margins"
        description="Wholesale costs and markups are private business data — never shown on the storefront or exposed by public APIs. Customers see only the final retail price."
        actions={
          <SmallButton tone="primary" onClick={() => setAddingSupplier(true)}>
            <Plus className="h-3.5 w-3.5" /> Add supplier
          </SmallButton>
        }
      />

      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading suppliers…" /> : null}
        {!loading && !error && suppliers.length === 0 ? (
          <EmptyState
            title="No suppliers yet"
            description="Add a supplier, then create catalogue entries with wholesale pricing and markups."
            action={
              <SmallButton tone="primary" onClick={() => setAddingSupplier(true)}>
                Add supplier
              </SmallButton>
            }
          />
        ) : null}

        {!loading && !error && suppliers.length > 0 ? (
          <div className="space-y-5">
            {suppliers.map((supplier) => (
              <AdminCard
                key={supplier.id}
                title={supplier.name}
                description={
                  [
                    supplier.contactPerson,
                    supplier.phone,
                    supplier.email,
                    supplier.catalogName ? `Catalogue: ${supplier.catalogName}` : null,
                    supplier.notes,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No contact details recorded."
                }
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <SmallButton onClick={() => setEntryFor(supplier)}>
                      <Plus className="h-3.5 w-3.5" /> Catalogue entry
                    </SmallButton>
                    <SmallButton
                      tone="danger"
                      onClick={() =>
                        setDeleteTarget({
                          kind: "supplier",
                          id: supplier.id,
                          name: supplier.name,
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </SmallButton>
                  </div>
                }
                bodyClassName="p-0"
              >
                {supplier.catalogueEntries.length === 0 ? (
                  <p className="px-5 py-5 text-[12.5px] text-taupe">
                    No catalogue entries yet. Add one to record wholesale pricing.
                  </p>
                ) : (
                  <AdminTableScroll minWidth={780}>
                    <thead>
                      <TableHeadRow>
                        <Th>Item</Th>
                        <Th>Ref</Th>
                        <Th>Wholesale</Th>
                        <Th>Markup</Th>
                        <Th>Suggested retail</Th>
                        <Th>Linked product</Th>
                        <Th right>Actions</Th>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {supplier.catalogueEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/70 last:border-0">
                          <Td className="font-medium text-espresso">{entry.itemName}</Td>
                          <Td className="text-espresso/70">{entry.supplierRef ?? "—"}</Td>
                          <Td className="text-espresso/80">{formatINR(entry.wholesalePrice)}</Td>
                          <Td className="text-espresso/80">
                            {entry.markupPct}%
                            {entry.fixedMarkup > 0 ? ` + ${formatINR(entry.fixedMarkup)}` : ""}
                          </Td>
                          <Td className="font-semibold text-gold-deep">
                            {formatINR(computeRetail(entry.wholesalePrice, entry.markupPct, entry.fixedMarkup))}
                          </Td>
                          <Td className="text-[12px]">
                            {entry.product ? (
                              <>
                                <span className="text-espresso/80">{entry.product.name}</span>
                                <span className="mt-0.5 block text-taupe">
                                  retail {formatINR(entry.product.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-taupe">Not linked — add in Products</span>
                            )}
                          </Td>
                          <Td right>
                            <SmallButton
                              tone="danger"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "entry",
                                  id: entry.id,
                                  name: entry.itemName,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </SmallButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </AdminTableScroll>
                )}
              </AdminCard>
            ))}

            <div className="flex items-start gap-3 border border-border bg-champagne/25 p-5 text-[12.5px] leading-relaxed text-espresso/75">
              <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
              <p>
                <strong className="text-espresso">How pricing works:</strong> suggested retail =
                wholesale × (1 + markup %) + fixed markup, rounded up. Set the product’s retail
                price in Products to the suggested value (or adjust it — the storefront only ever
                shows retail).
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <AdminModal
        open={addingSupplier}
        title="Add a supplier"
        description="Contact details stay internal and are never shown to customers."
        onClose={() => setAddingSupplier(false)}
      >
        <SupplierForm
          onCancel={() => setAddingSupplier(false)}
          onSaved={() => {
            setAddingSupplier(false);
            void load();
          }}
        />
      </AdminModal>

      <AdminModal
        open={entryFor !== null}
        title={entryFor ? `Catalogue entry — ${entryFor.name}` : "Catalogue entry"}
        description="Record the wholesale cost and markup. Nothing here reaches the storefront."
        onClose={() => setEntryFor(null)}
      >
        {entryFor ? (
          <EntryForm
            supplier={entryFor}
            onCancel={() => setEntryFor(null)}
            onSaved={() => {
              setEntryFor(null);
              void load();
            }}
          />
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={
          deleteTarget?.kind === "supplier"
            ? `Delete supplier “${deleteTarget.name}”?`
            : `Remove catalogue entry “${deleteTarget?.name ?? ""}”?`
        }
        description={
          deleteTarget?.kind === "supplier"
            ? "The supplier and its catalogue entries will be removed. Past orders are not affected."
            : "The wholesale entry will be removed. Any linked product stays in the catalogue."
        }
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SupplierForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    catalogName: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Enter a supplier name", description: "This is the only required field." });
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/suppliers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast({ title: "Supplier added" });
      onSaved();
    } catch (err) {
      toast({ title: "Could not add supplier", description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier name" required className="sm:col-span-2">
          <input className="field-hq" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Contact person">
          <input className="field-hq" value={form.contactPerson} onChange={set("contactPerson")} />
        </Field>
        <Field label="Phone">
          <input className="field-hq" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Email">
          <input className="field-hq" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Catalogue name">
          <input className="field-hq" value={form.catalogName} onChange={set("catalogName")} />
        </Field>
        <Field label="Internal notes" className="sm:col-span-2">
          <textarea
            className="field-hq min-h-20 py-2.5"
            value={form.notes}
            onChange={set("notes")}
          />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <SmallButton onClick={onCancel} disabled={saving}>Cancel</SmallButton>
        <SmallButton tone="primary" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Add supplier"}
        </SmallButton>
      </div>
    </div>
  );
}

function EntryForm({
  supplier,
  onCancel,
  onSaved,
}: {
  supplier: Supplier;
  onCancel: () => void;
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
    () =>
      computeRetail(
        Number(form.wholesalePrice) || 0,
        Number(form.markupPct) || 0,
        Number(form.fixedMarkup) || 0
      ),
    [form.wholesalePrice, form.markupPct, form.fixedMarkup]
  );

  const save = async () => {
    if (!form.itemName.trim() || !(form.wholesalePrice > 0)) {
      toast({
        title: "Item name and wholesale price are required",
        description: "Enter both before saving the entry.",
      });
      return;
    }
    setSaving(true);
    try {
      const result = await adminFetch<{ suggestedRetail?: number }>("/api/admin/suppliers/entries", {
        method: "POST",
        body: JSON.stringify({ ...form, supplierId: supplier.id }),
      });
      toast({
        title: "Entry added",
        description: `Suggested retail ${formatINR(result.suggestedRetail ?? suggested)}`,
      });
      onSaved();
    } catch (err) {
      toast({ title: "Could not add entry", description: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Item name" required>
          <input
            className="field-hq"
            value={form.itemName}
            onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
          />
        </Field>
        <Field label="Supplier reference">
          <input
            className="field-hq"
            value={form.supplierRef}
            onChange={(event) => setForm((prev) => ({ ...prev, supplierRef: event.target.value }))}
          />
        </Field>
        <Field label="Wholesale price (₹)" required>
          <input
            type="number"
            min="1"
            className="field-hq"
            value={form.wholesalePrice || ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, wholesalePrice: Number(event.target.value) }))
            }
          />
        </Field>
        <Field label="Markup %">
          <input
            type="number"
            min="0"
            className="field-hq"
            value={form.markupPct}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, markupPct: Number(event.target.value) }))
            }
          />
        </Field>
        <Field label="Fixed markup (₹)">
          <input
            type="number"
            min="0"
            className="field-hq"
            value={form.fixedMarkup}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fixedMarkup: Number(event.target.value) }))
            }
          />
        </Field>
        <Field label="Availability">
          <select
            className="field-hq"
            value={form.availability}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, availability: event.target.value }))
            }
          >
            <option value="AVAILABLE">Available</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </Field>
        <Field label="Internal notes" className="sm:col-span-2">
          <textarea
            className="field-hq min-h-20 py-2.5"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3 border border-gold/40 bg-champagne/25 p-4">
        <p className="text-[12.5px] text-espresso/80">
          Suggested retail:{" "}
          <span className="font-display text-2xl font-semibold text-gold-deep">
            {formatINR(suggested)}
          </span>
          <span className="ml-2 text-[11px] text-taupe">
            ({formatINR(form.wholesalePrice)} + {form.markupPct}% + {formatINR(form.fixedMarkup)},
            rounded up)
          </span>
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <SmallButton onClick={onCancel} disabled={saving}>Cancel</SmallButton>
        <SmallButton tone="primary" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Add entry"}
        </SmallButton>
      </div>
    </div>
  );
}
