"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status";
import {
  AdminBadge,
  AdminModal,
  AdminPageHeader,
  AdminSearchInput,
  AdminTableScroll,
  AdminToolbar,
  BulkBar,
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
import type { AdminOrder, AdminOrderStatusEvent, Pagination } from "@/lib/admin-types";
import {
  ORDER_NEXT_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
} from "@/lib/admin-labels";
import { formatINR } from "@/lib/money";

type OrdersResponse = { orders: AdminOrder[]; pagination: Pagination };
type OrderDetail = AdminOrder & {
  statusHistory: AdminOrderStatusEvent[];
  shippingRule?: { name: string; flatFee: number; freeThreshold: number | null } | null;
};

const STATUS_ACTION: Record<string, string> = {
  CONFIRMED: "Confirm order",
  PROCESSING: "Start preparing",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
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
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState("UNPAID");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (search) params.set("search", search);
      if (status !== "all") params.append("status", status);
      if (paymentStatus !== "all") params.append("paymentStatus", paymentStatus);
      const data = await adminFetch<OrdersResponse>(`/api/admin/orders?${params.toString()}`);
      setOrders(data.orders ?? []);
      setPagination(data.pagination ?? { page, pageSize: 25, total: 0, totalPages: 1 });
      setSelected(new Set());
    } catch (err) {
      setError(errorMessage(err, "Orders could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, paymentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await adminFetch<{ order: OrderDetail }>(`/api/admin/orders/${id}`);
      const order = data.order;
      setDetail(order);
      setPaymentDraft(order.paymentStatus);
      setCarrier(order.carrier ?? "");
      setTrackingNumber(order.trackingNumber ?? "");
      setInternalNotes(order.internalNotes ?? "");
    } catch (err) {
      toast({ title: "Could not open order", description: errorMessage(err) });
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async (id: string) => {
    try {
      const data = await adminFetch<{ order: OrderDetail }>(`/api/admin/orders/${id}`);
      setDetail(data.order);
    } catch {
      // The list refresh below will surface any session problem.
    }
  };

  const changeStatus = async (next: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/orders/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast({
        title: "Order status updated",
        description: `${detail.orderNumber} is now ${ORDER_STATUS_LABEL[next] ?? next.toLowerCase()}.`,
      });
      setConfirmStatus(null);
      await Promise.all([refreshDetail(detail.id), load()]);
    } catch (err) {
      toast({ title: "Status not changed", description: errorMessage(err) });
      setConfirmStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const saveOrderDetails = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/orders/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          paymentStatus: paymentDraft,
          carrier: carrier.trim() || null,
          trackingNumber: trackingNumber.trim() || null,
          internalNotes: internalNotes.trim() || null,
        }),
      });
      toast({ title: "Order details saved" });
      await Promise.all([refreshDetail(detail.id), load()]);
    } catch (err) {
      toast({ title: "Could not save details", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const applyBulk = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBusy(true);
    try {
      const result = await adminFetch<{
        updated: string[];
        skipped: { orderNumber: string; reason: string }[];
      }>("/api/admin/orders/bulk", {
        method: "PATCH",
        body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
      });
      toast({
        title: `${result.updated.length} order${result.updated.length === 1 ? "" : "s"} updated`,
        description:
          result.skipped.length > 0
            ? `${result.skipped.length} skipped — ${result.skipped[0].orderNumber}: ${result.skipped[0].reason}`
            : undefined,
      });
      setSelected(new Set());
      setBulkStatus("");
      setConfirmBulk(false);
      if (detail) await refreshDetail(detail.id);
      await load();
    } catch (err) {
      toast({ title: "Could not update orders", description: errorMessage(err) });
      setConfirmBulk(false);
    } finally {
      setBusy(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) orders.forEach((o) => next.delete(o.id));
      else orders.forEach((o) => next.add(o.id));
      return next;
    });
  };

  const nextStatuses = detail ? (ORDER_NEXT_STATUSES[detail.status] ?? []) : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Find orders, see exactly what was purchased, and move each one through the next step."
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
            placeholder="Order number, customer, email or phone"
          />
          <SmallButton type="submit">
            <Search className="h-3.5 w-3.5" /> Search
          </SmallButton>
        </form>
        <FilterSelect
          label="Order status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Payment status"
          value={paymentStatus}
          onChange={(value) => {
            setPaymentStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All payments" },
            ...PAYMENT_STATUSES.map((value) => ({
              value,
              label: PAYMENT_STATUS_LABEL[value],
            })),
          ]}
        />
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading orders…" /> : null}
        {!loading && !error && orders.length === 0 ? (
          <EmptyState
            title={search || status !== "all" || paymentStatus !== "all" ? "No orders match this view" : "No orders yet"}
            description={
              search || status !== "all" || paymentStatus !== "all"
                ? "Try a different search or clear the filters."
                : "Orders placed on the website will appear here instantly."
            }
            action={
              search || status !== "all" || paymentStatus !== "all" ? (
                <SmallButton
                  onClick={() => {
                    setSearchDraft("");
                    setSearch("");
                    setStatus("all");
                    setPaymentStatus("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </SmallButton>
              ) : undefined
            }
          />
        ) : null}
        {!loading && !error && orders.length > 0 ? (
          <>
            <AdminTableScroll minWidth={860}>
              <thead>
                <TableHeadRow>
                  <Th>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={togglePage}
                      className="h-4 w-4 accent-gold"
                      aria-label="Select all orders on this page"
                    />
                  </Th>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Placed</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th right>Action</Th>
                </TableHeadRow>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/70 last:border-0">
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelection(o.id)}
                        className="h-4 w-4 accent-gold"
                        aria-label={`Select ${o.orderNumber}`}
                      />
                    </Td>
                    <Td>
                      <p className="font-semibold text-espresso">{o.orderNumber}</p>
                      <p className="text-[11px] text-taupe">{o.items.length} line{o.items.length === 1 ? "" : "s"}</p>
                    </Td>
                    <Td>
                      <p className="text-espresso">{o.customerName}</p>
                      <p className="text-[11px] text-taupe">{o.phone}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-espresso/70">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Td>
                    <Td className="font-medium text-espresso">{formatINR(o.total)}</Td>
                    <Td><OrderStatusBadge status={o.status} /></Td>
                    <Td><PaymentStatusBadge status={o.paymentStatus} /></Td>
                    <Td right>
                      <SmallButton onClick={() => void openDetail(o.id)}>Open</SmallButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </AdminTableScroll>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Bulk status"
                value={bulkStatus}
                onChange={setBulkStatus}
                options={[
                  { value: "", label: "Move selected orders to…" },
                  ...Object.entries(STATUS_ACTION).map(([value, label]) => ({ value, label })),
                ]}
              />
              <SmallButton
                disabled={selected.size === 0 || !bulkStatus}
                onClick={() => setConfirmBulk(true)}
              >
                Apply to selected
              </SmallButton>
            </div>
            <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
              <span className="text-[11px] text-taupe">Only allowed next steps are applied.</span>
            </BulkBar>

            <div className="mt-4 border border-border bg-white">
              <PaginationBar pagination={pagination} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>

      <AdminModal
        open={detail !== null || detailLoading}
        title={detail ? detail.orderNumber : "Opening order…"}
        description={
          detail
            ? `Placed ${new Date(detail.createdAt).toLocaleString("en-IN")}`
            : undefined
        }
        onClose={() => setDetail(null)}
        wide
      >
        {detailLoading ? (
          <LoadingState label="Loading order details…" />
        ) : detail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={detail.status} />
              <PaymentStatusBadge status={detail.paymentStatus} />
              <span className="text-[11.5px] text-taupe">
                {detail.paymentMethod.replace(/_/g, " ")}
              </span>
              {detail.paymentRef ? (
                <span className="text-[11px] text-taupe">Ref: {detail.paymentRef}</span>
              ) : null}
            </div>

            {nextStatuses.length > 0 ? (
              <div className="border border-gold/30 bg-champagne/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
                  Next step
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStatuses.map((next) => (
                    <SmallButton
                      key={next}
                      tone={next === "CANCELLED" ? "danger" : "primary"}
                      onClick={() => setConfirmStatus(next)}
                    >
                      {STATUS_ACTION[next] ?? ORDER_STATUS_LABEL[next]}
                    </SmallButton>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-taupe">
                  You cannot skip steps. Cancelling returns stock to the shelves.
                </p>
              </div>
            ) : (
              <p className="border border-border bg-cream/40 px-4 py-3 text-[12px] text-taupe">
                This order is at its final status: {ORDER_STATUS_LABEL[detail.status] ?? detail.status}.
              </p>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="border border-border bg-white p-4">
                  <p className="field-label">Customer</p>
                  <p className="mt-2 font-medium text-espresso">{detail.customerName}</p>
                  <p className="text-[12.5px] text-espresso/75">{detail.phone}</p>
                  <p className="text-[12.5px] text-espresso/75">{detail.email}</p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-espresso/75">
                    {detail.addressLine1}
                    {detail.addressLine2 ? `, ${detail.addressLine2}` : ""}
                    <br />
                    {detail.city}, {detail.state} — {detail.pincode}
                  </p>
                  {detail.customerNote ? (
                    <p className="mt-3 border-l-2 border-gold pl-3 text-[12px] italic text-espresso/70">
                      “{detail.customerNote}”
                    </p>
                  ) : null}
                </div>

                <div className="border border-border bg-white p-4">
                  <p className="field-label">Payment, delivery & team notes</p>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Payment status">
                        <select
                          className="field-hq"
                          value={paymentDraft}
                          onChange={(event) => setPaymentDraft(event.target.value)}
                        >
                          {PAYMENT_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {PAYMENT_STATUS_LABEL[value]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Courier / carrier">
                        <input
                          className="field-hq"
                          value={carrier}
                          onChange={(event) => setCarrier(event.target.value)}
                          placeholder="e.g. Blue Dart"
                        />
                      </Field>
                    </div>
                    <Field label="Tracking number">
                      <input
                        className="field-hq"
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.target.value)}
                        placeholder="Tracking reference"
                      />
                    </Field>
                    <Field label="Internal notes" hint="Only your team can see this.">
                      <textarea
                        className="field-hq min-h-20 py-2.5"
                        value={internalNotes}
                        onChange={(event) => setInternalNotes(event.target.value)}
                        placeholder="Packing instructions, customer follow-up…"
                      />
                    </Field>
                    <SmallButton tone="primary" disabled={busy} onClick={() => void saveOrderDetails()}>
                      Save order details
                    </SmallButton>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="field-label">Purchased pieces</p>
                  <ul className="mt-2 divide-y divide-border border border-border bg-white">
                    {detail.items.map((item) => (
                      <li key={item.id} className="flex gap-3 p-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-16 w-12 shrink-0 border border-border object-cover"
                          />
                        ) : (
                          <span className="flex h-16 w-12 shrink-0 items-center justify-center border border-dashed border-border text-[9px] text-taupe">
                            No image
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-medium text-espresso">{item.productName}</p>
                          <p className="text-[11px] text-taupe">
                            {[item.color, item.size].filter(Boolean).join(" / ") || "Standard option"} · Qty {item.quantity}
                          </p>
                          <p className="mt-1 text-[11px] text-espresso/70">
                            Paid {formatINR(item.unitPrice)} each ({formatINR(item.lineTotal)} total)
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-3 space-y-1.5 border border-border bg-white p-4 text-[12.5px]">
                    <div className="flex justify-between"><dt className="text-espresso/70">Subtotal</dt><dd>{formatINR(detail.subtotal)}</dd></div>
                    <div className="flex justify-between"><dt className="text-espresso/70">Shipping</dt><dd>{detail.shippingFee === 0 ? "Complimentary" : formatINR(detail.shippingFee)}</dd></div>
                    {detail.discount > 0 ? (
                      <div className="flex justify-between"><dt className="text-espresso/70">Discount</dt><dd>−{formatINR(detail.discount)}</dd></div>
                    ) : null}
                    {detail.tax > 0 ? (
                      <div className="flex justify-between"><dt className="text-espresso/70">Tax</dt><dd>{formatINR(detail.tax)}</dd></div>
                    ) : null}
                    <div className="flex justify-between border-t border-border pt-2 text-[14px] font-semibold text-espresso">
                      <dt>Total paid / payable</dt><dd>{formatINR(detail.total)}</dd>
                    </div>
                  </dl>
                  {detail.shippingRule ? (
                    <p className="mt-2 text-[11px] text-taupe">
                      Shipping rule: {detail.shippingRule.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="field-label">Order timeline</p>
                  <ol className="mt-2 space-y-3 border-l border-border pl-4">
                    {detail.statusHistory.length === 0 ? (
                      <li className="text-[12px] text-taupe">
                        Order created as {ORDER_STATUS_LABEL[detail.status] ?? detail.status} on{" "}
                        {new Date(detail.createdAt).toLocaleString("en-IN")}. Status history will appear as the order moves.
                      </li>
                    ) : (
                      detail.statusHistory.map((event) => (
                        <li key={event.id} className="relative text-[12px]">
                          <span className="absolute -left-[21px] top-1 h-2 w-2 bg-gold" />
                          <p className="font-medium text-espresso">
                            {event.fromStatus
                              ? `${ORDER_STATUS_LABEL[event.fromStatus] ?? event.fromStatus} → ${ORDER_STATUS_LABEL[event.toStatus] ?? event.toStatus}`
                              : `Created as ${ORDER_STATUS_LABEL[event.toStatus] ?? event.toStatus}`}
                          </p>
                          <p className="text-[11px] text-taupe">
                            {new Date(event.createdAt).toLocaleString("en-IN")}
                            {event.note ? ` · ${event.note}` : ""}
                          </p>
                        </li>
                      ))
                    )}
                  </ol>
                </div>
              </div>
            </div>

            {detail.cancelledAt ? (
              <AdminBadge tone="danger">
                Cancelled {new Date(detail.cancelledAt).toLocaleString("en-IN")}
                {detail.cancellationReason ? ` — ${detail.cancellationReason}` : ""}
              </AdminBadge>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={confirmBulk}
        title={`Move ${selected.size} order${selected.size === 1 ? "" : "s"} to ${ORDER_STATUS_LABEL[bulkStatus] ?? bulkStatus}?`}
        description="Only orders where this is the valid next step will change. You will see a summary of anything skipped."
        confirmLabel="Update orders"
        busy={busy}
        onConfirm={() => void applyBulk()}
        onCancel={() => setConfirmBulk(false)}
      />

      <ConfirmDialog
        open={confirmStatus !== null}
        title={`${STATUS_ACTION[confirmStatus ?? ""] ?? "Update order"}?`}
        description={
          confirmStatus === "CANCELLED"
            ? "This cancels the order and returns its stock. This cannot be undone."
            : `${detail?.orderNumber ?? "This order"} will move to ${ORDER_STATUS_LABEL[confirmStatus ?? ""] ?? ""}.`
        }
        confirmLabel={STATUS_ACTION[confirmStatus ?? ""] ?? "Confirm"}
        tone={confirmStatus === "CANCELLED" ? "danger" : "primary"}
        busy={busy}
        onConfirm={() => void changeStatus(confirmStatus ?? "")}
        onCancel={() => setConfirmStatus(null)}
      />
    </div>
  );
}
