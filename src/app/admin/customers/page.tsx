"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status";
import {
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminTableScroll,
  AdminToolbar,
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationBar,
  SmallButton,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import type { AdminCustomerDetail, AdminCustomerSummary, Pagination } from "@/lib/admin-types";
import { formatINR } from "@/lib/money";

type CustomersResponse = { customers: AdminCustomerSummary[]; pagination: Pagination };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
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
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (search) params.set("search", search);
      const data = await adminFetch<CustomersResponse>(`/api/admin/customers?${params.toString()}`);
      setCustomers(data.customers ?? []);
      setPagination(data.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(errorMessage(err, "Customers could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCustomer = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await adminFetch<{ customer: AdminCustomerDetail }>(`/api/admin/customers/${id}`);
      setDetail(data.customer);
    } catch (err) {
      toast({ title: "Could not open customer", description: errorMessage(err) });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Look up a customer by phone or email and see every order they have placed."
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
            placeholder="Phone number, email or name"
          />
          <SmallButton type="submit">
            <Search className="h-3.5 w-3.5" /> Search
          </SmallButton>
        </form>
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading customers…" /> : null}
        {!loading && !error && customers.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
            title={search ? "No customer found" : "No customers yet"}
            description={
              search
                ? "Check the phone number or email, or try a partial name."
                : "Customers are added automatically when an order is placed."
            }
          />
        ) : null}
        {!loading && !error && customers.length > 0 ? (
          <>
            <AdminTableScroll minWidth={760}>
              <thead>
                <TableHeadRow>
                  <Th>Customer</Th>
                  <Th>Contact</Th>
                  <Th>Orders</Th>
                  <Th>Total spend</Th>
                  <Th>Last order</Th>
                  <Th right>Action</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/70 last:border-0">
                    <Td>
                      <p className="font-medium text-espresso">{c.name}</p>
                      <p className="text-[11px] text-taupe">
                        First seen {new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-espresso/80">{c.phone}</p>
                      <p className="text-[11px] text-taupe">{c.email ?? "No email"}</p>
                    </Td>
                    <Td>{c.orderCount}</Td>
                    <Td className="font-medium text-espresso">{formatINR(c.totalSpend)}</Td>
                    <Td className="text-espresso/70">
                      {c.lastOrderAt
                        ? new Date(c.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : "—"}
                    </Td>
                    <Td right>
                      <SmallButton onClick={() => void openCustomer(c.id)}>View history</SmallButton>
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

      <AdminModal
        open={detail !== null || detailLoading}
        title={detail ? detail.name : "Opening customer…"}
        description={detail ? `${detail.phone}${detail.email ? ` · ${detail.email}` : ""}` : undefined}
        onClose={() => setDetail(null)}
        wide
      >
        {detailLoading ? (
          <LoadingState label="Loading customer history…" />
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Total orders", String(detail.orderCount)],
                ["Total spend", formatINR(detail.totalSpend)],
                [
                  "Last order",
                  detail.lastOrderAt
                    ? new Date(detail.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="border border-border bg-cream/30 p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-taupe">{label}</p>
                  <p className="mt-1 font-display text-xl text-espresso">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="field-label">Past orders</p>
              {detail.orders.length === 0 ? (
                <p className="mt-2 border border-border bg-white p-4 text-[12.5px] text-taupe">
                  This customer has no orders yet.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {detail.orders.map((order) => (
                    <div key={order.id} className="border border-border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-espresso">{order.orderNumber}</p>
                          <p className="text-[11px] text-taupe">
                            {new Date(order.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {" · "}
                            {order.items.length} line{order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <OrderStatusBadge status={order.status} />
                          <PaymentStatusBadge status={order.paymentStatus} />
                          <span className="font-medium text-espresso">{formatINR(order.total)}</span>
                        </div>
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-taupe">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.productName} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
