"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { adminFetch, errorMessage } from "@/components/admin/api";
import {
  AdminBadge,
  AdminPageHeader,
  AdminSearchInput,
  AdminTableScroll,
  AdminToolbar,
  EmptyState,
  ErrorState,
  FilterSelect,
  LoadingState,
  PaginationBar,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import type { AuditLogRow, Pagination } from "@/lib/admin-types";

type AuditResponse = { items: AuditLogRow[]; pagination: Pagination };

const ACTIONS = [
  "PRODUCT_CREATE",
  "PRODUCT_UPDATE",
  "PRODUCT_DELETE",
  "PRODUCT_BULK_PUBLISH",
  "PRODUCT_BULK_UNPUBLISH",
  "INVENTORY_STOCK_ADJUST",
  "ORDER_STATUS_UPDATE",
  "ORDER_BULK_STATUS_UPDATE",
  "INQUIRY_STATUS_UPDATE",
  "CONTENT_UPDATE",
  "ADMIN_PASSWORD_CHANGED",
];

const ENTITIES = ["Product", "ProductVariant", "Order", "MeasurementInquiry", "Supplier", "SiteContent"];

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
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
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (search) params.set("search", search);
      if (action !== "all") params.set("action", action);
      if (entityType !== "all") params.set("entityType", entityType);
      const data = await adminFetch<AuditResponse>(`/api/admin/audit-logs?${params.toString()}`);
      setRows(data.items ?? []);
      setPagination(data.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(errorMessage(err, "Audit history could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search, action, entityType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Safety"
        title="Activity log"
        description="A read-only record of important admin actions: price changes, publishing, stock, orders and more."
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
            placeholder="Actor, action, entity or ID"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso hover:border-gold hover:text-gold">
            <Search className="h-3.5 w-3.5" /> Search
          </button>
        </form>
        <FilterSelect
          label="Action"
          value={action}
          onChange={(value) => {
            setAction(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All actions" },
            ...ACTIONS.map((value) => ({ value, label: value.replace(/_/g, " ").toLowerCase() })),
          ]}
        />
        <FilterSelect
          label="Item type"
          value={entityType}
          onChange={(value) => {
            setEntityType(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All item types" },
            ...ENTITIES.map((value) => ({ value, label: value.replace(/([a-z])([A-Z])/g, "$1 $2") })),
          ]}
        />
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading activity…" /> : null}
        {!loading && !error && rows.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.5} />}
            title="No activity found"
            description="Try a different filter. Actions made in this panel are recorded here."
          />
        ) : null}
        {!loading && !error && rows.length > 0 ? (
          <>
            <AdminTableScroll minWidth={820}>
              <thead>
                <TableHeadRow>
                  <Th>When</Th>
                  <Th>Who</Th>
                  <Th>Action</Th>
                  <Th>Item</Th>
                  <Th>Details</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0">
                    <Td className="whitespace-nowrap text-espresso/70">
                      {new Date(row.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Td>
                    <Td>
                      <p className="text-espresso">{row.actorEmail ?? "System"}</p>
                      <p className="text-[10.5px] text-taupe">{row.ip ?? "—"}</p>
                    </Td>
                    <Td>
                      <AdminBadge tone="info">{row.action.replace(/_/g, " ").toLowerCase()}</AdminBadge>
                    </Td>
                    <Td className="text-espresso/75">
                      {row.entityType}
                      {row.entityId ? (
                        <span className="block text-[10.5px] text-taupe">{row.entityId.slice(0, 12)}…</span>
                      ) : null}
                    </Td>
                    <Td className="max-w-[300px] text-[11.5px] text-taupe">
                      {row.metadata && Object.keys(row.metadata).length > 0
                        ? Object.entries(row.metadata)
                            .slice(0, 3)
                            .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
                            .join(" · ")
                        : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </AdminTableScroll>
            <div className="mt-4 border border-border bg-white">
              <PaginationBar pagination={pagination} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
