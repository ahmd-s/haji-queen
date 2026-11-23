"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpDown, History, PackageSearch } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import {
  AdminBadge,
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminTableScroll,
  AdminToolbar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  FilterSelect,
  LoadingState,
  PaginationBar,
  SmallButton,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import type { InventoryRow, Pagination, StockMovementRow } from "@/lib/admin-types";

type InventoryResponse = { items: InventoryRow[]; pagination: Pagination };
type MovementsResponse = { movements: StockMovementRow[] };

const REASON_LABEL: Record<string, string> = {
  PURCHASE: "Opening stock",
  RESTOCK: "Restock",
  ORDER_PLACED: "Sold on website",
  ORDER_CANCELLED: "Order cancelled — stock returned",
  MANUAL_ADJUSTMENT: "Manual adjustment",
};

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState("0");
  const [active, setActive] = useState("1");
  const [page, setPage] = useState(1);

  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [confirmAdjust, setConfirmAdjust] = useState(false);
  const [busy, setBusy] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<InventoryRow | null>(null);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        lowStock,
        active,
      });
      if (search) params.set("search", search);
      const data = await adminFetch<InventoryResponse>(`/api/admin/inventory?${params.toString()}`);
      setRows(data.items ?? []);
      setPagination(data.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(errorMessage(err, "Inventory could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search, lowStock, active]);

  useEffect(() => {
    void load();
  }, [load]);

  const openHistory = async (row: InventoryRow) => {
    setHistoryTarget(row);
    setHistoryLoading(true);
    setMovements([]);
    try {
      const data = await adminFetch<MovementsResponse>(
        `/api/admin/inventory/${row.variantId}/movements`
      );
      setMovements(data.movements ?? []);
    } catch (err) {
      toast({ title: "Could not load stock history", description: errorMessage(err) });
    } finally {
      setHistoryLoading(false);
    }
  };

  const parsedDelta = Number(delta);
  const adjustmentValid =
    adjustTarget !== null &&
    Number.isInteger(parsedDelta) &&
    parsedDelta !== 0 &&
    Math.abs(parsedDelta) <= 9999 &&
    adjustTarget.stock + parsedDelta >= 0;

  const confirmRestock = async () => {
    if (!adjustTarget || !adjustmentValid) return;
    setBusy(true);
    try {
      const result = await adminFetch<{ stock: number; label: string }>(
        `/api/admin/inventory/${adjustTarget.variantId}/restock`,
        {
          method: "POST",
          body: JSON.stringify({ delta: parsedDelta, note: note.trim() }),
        }
      );
      toast({
        title: "Stock updated",
        description: `${result.label} now has ${result.stock} sellable unit${result.stock === 1 ? "" : "s"}.`,
      });
      setAdjustTarget(null);
      setDelta("");
      setNote("");
      setConfirmAdjust(false);
      await load();
    } catch (err) {
      toast({ title: "Could not update stock", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Stock"
        title="Inventory"
        description="See exactly what can be sold per colour and size. Product stock totals are calculated from these rows."
      />

      <AdminToolbar>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
            setPage(1);
          }}
        >
          <AdminSearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search product, SKU, size or colour"
          />
          <SmallButton type="submit">Search</SmallButton>
        </form>
        <FilterSelect
          label="Stock level"
          value={lowStock}
          onChange={(value) => {
            setLowStock(value);
            setPage(1);
          }}
          options={[
            { value: "0", label: "All stock levels" },
            { value: "1", label: "Low stock only" },
          ]}
        />
        <FilterSelect
          label="Options"
          value={active}
          onChange={(value) => {
            setActive(value);
            setPage(1);
          }}
          options={[
            { value: "1", label: "Active options only" },
            { value: "0", label: "Include inactive" },
          ]}
        />
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading inventory…" /> : null}
        {!loading && !error && rows.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="h-5 w-5" strokeWidth={1.5} />}
            title="No stock rows found"
            description="Try clearing the filters, or add sizes and colours to a product in the Products screen."
            action={
              <SmallButton
                onClick={() => {
                  setSearchDraft("");
                  setSearch("");
                  setLowStock("0");
                  setActive("1");
                  setPage(1);
                }}
              >
                Clear filters
              </SmallButton>
            }
          />
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <>
            <AdminTableScroll minWidth={860}>
              <thead>
                <TableHeadRow>
                  <Th>Product</Th>
                  <Th>Option</Th>
                  <Th>Sellable stock</Th>
                  <Th>Alert at</Th>
                  <Th>Status</Th>
                  <Th right>Actions</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const low = row.stock <= row.lowStockThreshold;
                  return (
                    <tr key={row.variantId} className="border-b border-border/70 last:border-0">
                      <Td>
                        <p className="font-medium text-espresso">{row.productName}</p>
                        <p className="text-[11px] text-taupe">
                          {row.productSku ?? row.categoryName}
                          {row.variantSku ? ` · ${row.variantSku}` : ""}
                        </p>
                      </Td>
                      <Td>
                        <span className="font-medium text-espresso">{row.color}</span>
                        <span className="text-taupe"> / {row.size}</span>
                        {row.extraPrice > 0 ? (
                          <p className="text-[11px] text-gold-deep">+₹{row.extraPrice.toLocaleString("en-IN")}</p>
                        ) : null}
                      </Td>
                      <Td>
                        <span className={`font-semibold ${low ? "text-destructive" : "text-espresso"}`}>
                          {row.stock}
                        </span>
                        <span className="text-taupe"> units</span>
                      </Td>
                      <Td className="text-espresso/70">{row.lowStockThreshold}</Td>
                      <Td>
                        <AdminBadge tone={!row.isActive ? "neutral" : low ? "warning" : "success"}>
                          {!row.isActive ? "Inactive" : low ? "Low stock" : "Available"}
                        </AdminBadge>
                      </Td>
                      <Td right>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <SmallButton
                            onClick={() => {
                              setAdjustTarget(row);
                              setDelta("");
                              setNote("");
                            }}
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" /> Adjust
                          </SmallButton>
                          <SmallButton onClick={() => void openHistory(row)}>
                            <History className="h-3.5 w-3.5" /> History
                          </SmallButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTableScroll>
            <div className="mt-4 border border-border bg-white">
              <PaginationBar pagination={pagination} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>

      <AdminModal
        open={adjustTarget !== null}
        title="Adjust sellable stock"
        description={
          adjustTarget
            ? `${adjustTarget.productName} — ${adjustTarget.color} / ${adjustTarget.size}. Currently ${adjustTarget.stock} units.`
            : undefined
        }
        onClose={() => setAdjustTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <SmallButton onClick={() => setAdjustTarget(null)}>Cancel</SmallButton>
            <SmallButton tone="primary" disabled={!adjustmentValid} onClick={() => setConfirmAdjust(true)}>
              Review adjustment
            </SmallButton>
          </div>
        }
      >
        <div className="space-y-4">
          <Field
            label="Quantity change"
            hint="Use a positive number for stock received, or a negative number for damaged/lost pieces."
            error={
              delta !== "" && !adjustmentValid
                ? adjustTarget && parsedDelta < 0 && adjustTarget.stock + parsedDelta < 0
                  ? `Only ${adjustTarget.stock} units can be removed.`
                  : "Enter a whole number between -9,999 and 9,999, not zero."
                : undefined
            }
            required
          >
            <input
              type="number"
              step="1"
              className="field-hq"
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
              placeholder="e.g. 10 or -2"
              autoFocus
            />
          </Field>
          <Field label="Reason / note" hint="Optional. This appears in the stock history.">
            <input
              className="field-hq"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. New batch received"
            />
          </Field>
          {adjustmentValid ? (
            <p className="border border-gold/30 bg-champagne/30 px-4 py-3 text-[12.5px] text-espresso">
              New sellable stock: <strong>{adjustTarget?.stock + parsedDelta}</strong> units
            </p>
          ) : null}
        </div>
      </AdminModal>

      <ConfirmDialog
        open={confirmAdjust}
        title="Confirm stock adjustment?"
        description={
          adjustTarget && adjustmentValid
            ? `${adjustTarget.productName} — ${adjustTarget.color} / ${adjustTarget.size}: ${adjustTarget.stock} → ${adjustTarget.stock + parsedDelta} units.`
            : undefined
        }
        confirmLabel="Update stock"
        busy={busy}
        onConfirm={() => void confirmRestock()}
        onCancel={() => setConfirmAdjust(false)}
      />

      <AdminModal
        open={historyTarget !== null}
        title="Stock movement history"
        description={
          historyTarget
            ? `${historyTarget.productName} — ${historyTarget.color} / ${historyTarget.size}`
            : undefined
        }
        onClose={() => setHistoryTarget(null)}
        wide
      >
        {historyLoading ? (
          <LoadingState label="Loading history…" />
        ) : movements.length === 0 ? (
          <EmptyState title="No movements recorded" description="Stock changes made in the admin panel will appear here." />
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[620px] text-left text-[12px]">
              <thead>
                <TableHeadRow>
                  <Th>When</Th>
                  <Th>Change</Th>
                  <Th>Reason</Th>
                  <Th>Details</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-border/70 last:border-0">
                    <Td className="whitespace-nowrap text-espresso/75">
                      {new Date(m.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Td>
                    <Td>
                      <span className={m.delta > 0 ? "font-semibold text-gold-deep" : "font-semibold text-destructive"}>
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </span>
                    </Td>
                    <Td>{REASON_LABEL[m.reason] ?? m.reason.replace(/_/g, " ")}</Td>
                    <Td className="text-espresso/70">
                      {m.orderNumber ? `Order ${m.orderNumber}` : ""}
                      {m.note ? <span className="block">{m.note}</span> : null}
                      {m.actorId ? <span className="block text-[10px] text-taupe">Admin ID {m.actorId.slice(0, 8)}</span> : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
