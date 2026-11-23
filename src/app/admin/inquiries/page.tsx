"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Mail, MessageCircle, Phone, Ruler, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminFetch, errorMessage } from "@/components/admin/api";
import { InquiryStatusBadge } from "@/components/admin/status";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import {
  AdminPageHeader,
  AdminSearchInput,
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
} from "@/components/admin/ui";
import type { AdminInquiry, Pagination } from "@/lib/admin-types";
import { INQUIRY_NEXT_STATUSES, INQUIRY_STATUS_LABEL } from "@/lib/admin-labels";

type InquiriesResponse = { inquiries: AdminInquiry[]; pagination: Pagination };

const MEASUREMENT_FIELDS: [keyof AdminInquiry, string][] = [
  ["bust", "Bust"],
  ["waist", "Waist"],
  ["hips", "Hips"],
  ["shoulder", "Shoulder"],
  ["sleeveLength", "Sleeve length"],
  ["armhole", "Armhole"],
  ["dressLength", "Dress length"],
  ["otherMeasurements", "Other measurements"],
];

const NEXT_ACTION: Record<string, string> = {
  IN_REVIEW: "Start review",
  SCHEDULED: "Consultation set",
  COMPLETED: "Mark completed",
  ARCHIVED: "Archive",
  NEW: "Reopen as new",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminInquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false);

  const notesDirty = detail ? notesDraft !== (detail.internalNotes ?? "") : false;
  useUnsavedChanges(
    notesDirty,
    "You have unsaved notes on this enquiry. Leave without saving?"
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (status !== "all") params.append("status", status);
      const data = await adminFetch<InquiriesResponse>(`/api/admin/inquiries?${params.toString()}`);
      const list = data.inquiries ?? [];
      setInquiries(list);
      setPagination(data.pagination ?? { page, pageSize: 20, total: 0, totalPages: 1 });
      setSelected(new Set());
      setSelectedId((current) =>
        current && list.some((i) => i.id === current) ? current : (list[0]?.id ?? null)
      );
    } catch (err) {
      setError(errorMessage(err, "Enquiries could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await adminFetch<{ inquiry: AdminInquiry }>(`/api/admin/inquiries/${id}`);
      setDetail(data.inquiry);
      setNotesDraft(data.inquiry.internalNotes ?? "");
    } catch (err) {
      toast({ title: "Could not open enquiry", description: errorMessage(err) });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const chooseInquiry = (id: string) => {
    if (notesDirty && id !== selectedId) setPendingSelectId(id);
    else setSelectedId(id);
  };

  const saveNotes = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/inquiries/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ internalNotes: notesDraft }),
      });
      await Promise.all([loadDetail(detail.id), load()]);
      toast({ title: "Note saved" });
    } catch (err) {
      toast({ title: "Could not save note", description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/inquiries/${detail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast({
        title: "Enquiry updated",
        description: `${detail.fullName} is now ${INQUIRY_STATUS_LABEL[next] ?? next}.`,
      });
      setConfirmStatus(null);
      await Promise.all([loadDetail(detail.id), load()]);
    } catch (err) {
      toast({ title: "Status not changed", description: errorMessage(err) });
      setConfirmStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const archiveSelected = async () => {
    setBusy(true);
    const results = await Promise.allSettled(
      [...selected].map((id) =>
        adminFetch(`/api/admin/inquiries/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ARCHIVED" }),
        })
      )
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    toast({
      title: `${ok} enquiry${ok === 1 ? "" : "ies"} archived`,
      description: results.length > ok ? `${results.length - ok} could not be archived from their current status.` : undefined,
    });
    setConfirmBulkArchive(false);
    await load();
    setBusy(false);
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextStatuses = detail ? (INQUIRY_NEXT_STATUSES[detail.status] ?? []) : [];
  const measurementValues = detail
    ? MEASUREMENT_FIELDS.map(([key, label]) => ({
        label,
        value: detail[key] == null ? null : String(detail[key]),
      })).filter((row) => row.value)
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Client requests"
        title="Enquiry inbox"
        description="Read measurement requests, keep internal notes, and move each enquiry to the next step. Sensitive details stay inside this panel."
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
            placeholder="Name, phone, email or garment"
          />
          <SmallButton type="submit">
            <Search className="h-3.5 w-3.5" /> Search
          </SmallButton>
        </form>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All statuses" },
            ...Object.entries(INQUIRY_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
      </AdminToolbar>

      <div className="mt-4">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading enquiries…" /> : null}
        {!loading && !error && inquiries.length === 0 ? (
          <EmptyState
            title={search || status !== "all" ? "No enquiries match this view" : "No enquiries yet"}
            description={
              search || status !== "all"
                ? "Try another name, phone number or status."
                : "Measurement requests from the website will appear here."
            }
            action={
              search || status !== "all" ? (
                <SmallButton
                  onClick={() => {
                    setSearchDraft("");
                    setSearch("");
                    setStatus("all");
                    setPage(1);
                  }}
                >
                  Clear filters
                </SmallButton>
              ) : undefined
            }
          />
        ) : null}

        {!loading && !error && inquiries.length > 0 ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-2">
                {inquiries.map((item) => (
                  <div
                    key={item.id}
                    className={`border bg-white p-3 ${
                      item.id === selectedId ? "border-gold ring-1 ring-gold/40" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => chooseInquiry(item.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate font-medium text-espresso">{item.fullName}</p>
                        <p className="truncate text-[11.5px] text-taupe">
                          {item.garmentType} · {item.phone}
                        </p>
                      </button>
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="mt-0.5 h-4 w-4 accent-gold"
                        aria-label={`Select enquiry from ${item.fullName}`}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <InquiryStatusBadge status={item.status} />
                      <span className="text-[10.5px] text-taupe">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-border bg-white">
                {detailLoading ? (
                  <LoadingState label="Opening enquiry…" />
                ) : detail ? (
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                      <div>
                        <p className="field-label">Measurement enquiry</p>
                        <h2 className="mt-1 font-display text-2xl text-espresso">{detail.fullName}</h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-taupe">
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</span>
                          {detail.email ? (
                            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{detail.email}</span>
                          ) : null}
                          <span>prefers {detail.preferredContact.toLowerCase()}</span>
                        </p>
                        <p className="mt-1 text-[12px] text-espresso/70">
                          {detail.garmentType} ·{" "}
                          {detail.sizingPreference === "CUSTOM"
                            ? "Custom sizing"
                            : `Standard ${detail.standardSize ?? "size"}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <InquiryStatusBadge status={detail.status} />
                        <a
                          href={`https://wa.me/${detail.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso hover:border-gold hover:text-gold"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-taupe">
                        Next action:
                      </span>
                      {nextStatuses.length > 0 ? (
                        nextStatuses.map((next) => (
                          <SmallButton
                            key={next}
                            tone={next === "ARCHIVED" ? "danger" : "primary"}
                            onClick={() => setConfirmStatus(next)}
                          >
                            {NEXT_ACTION[next] ?? INQUIRY_STATUS_LABEL[next]}
                          </SmallButton>
                        ))
                      ) : (
                        <span className="text-[12px] text-taupe">No further actions.</span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="flex items-center gap-1.5 field-label">
                          <Ruler className="h-3.5 w-3.5" /> Measurements
                        </p>
                        {measurementValues.length > 0 ? (
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                            {measurementValues.map((row) => (
                              <div key={row.label} className="flex justify-between border-b border-border/60 pb-1">
                                <dt className="text-taupe">{row.label}</dt>
                                <dd className="font-medium text-espresso">{row.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-2 text-[12px] text-taupe">No measurements supplied.</p>
                        )}
                        {detail.instructions ? (
                          <p className="mt-3 text-[12px] text-espresso/75">
                            <strong className="text-espresso">Instructions:</strong> {detail.instructions}
                          </p>
                        ) : null}
                        {detail.consultationDate ? (
                          <p className="mt-2 text-[12px] text-espresso/75">
                            Requested consultation: {detail.consultationDate}
                            {detail.consultationTime ? ` at ${detail.consultationTime}` : ""}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-3 text-[12px] text-espresso/75">
                        {detail.colorPreference ? (
                          <p><strong className="text-espresso">Colour:</strong> {detail.colorPreference}</p>
                        ) : null}
                        {detail.designNotes ? (
                          <p><strong className="text-espresso">Design:</strong> {detail.designNotes}</p>
                        ) : null}
                        {detail.source ? (
                          <p><strong className="text-espresso">Source:</strong> {detail.source}</p>
                        ) : null}
                        {detail.referenceImageUrl ? (
                          <div>
                            <p className="field-label flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5" /> Reference image
                            </p>
                            <img
                              src={detail.referenceImageUrl}
                              alt="Customer design reference"
                              className="mt-2 h-40 w-full border border-border object-contain bg-cream/40"
                            />
                          </div>
                        ) : null}
                        <Field
                          label="Internal notes"
                          hint="Saved only when you choose Save note."
                        >
                          <textarea
                            className="field-hq min-h-24 py-2.5"
                            value={notesDraft}
                            onChange={(event) => setNotesDraft(event.target.value)}
                            placeholder="Who responded, what was agreed, follow-up needed…"
                          />
                        </Field>
                        <SmallButton disabled={!notesDirty || busy} tone="primary" onClick={() => void saveNotes()}>
                          {busy ? "Saving…" : "Save note"}
                        </SmallButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="Select an enquiry"
                    description="Choose a request on the left to read measurements and notes."
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SmallButton disabled={selected.size === 0} onClick={() => setConfirmBulkArchive(true)}>
                Archive selected
              </SmallButton>
              <span className="text-[11px] text-taupe">Old or completed enquiries can be archived together.</span>
            </div>
            <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
              <span className="text-[11px] text-taupe">Ready to archive</span>
            </BulkBar>

            <div className="mt-4 border border-border bg-white">
              <PaginationBar pagination={pagination} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingSelectId !== null}
        title="Leave unsaved notes?"
        description="Your note on this enquiry has not been saved."
        confirmLabel="Leave without saving"
        tone="danger"
        onConfirm={() => {
          if (pendingSelectId) setSelectedId(pendingSelectId);
          setPendingSelectId(null);
        }}
        onCancel={() => setPendingSelectId(null)}
      />

      <ConfirmDialog
        open={confirmStatus !== null}
        title={`${NEXT_ACTION[confirmStatus ?? ""] ?? "Update enquiry"}?`}
        description={`${detail?.fullName ?? "This enquiry"} will move to ${INQUIRY_STATUS_LABEL[confirmStatus ?? ""] ?? ""}.`}
        confirmLabel={NEXT_ACTION[confirmStatus ?? ""] ?? "Confirm"}
        tone={confirmStatus === "ARCHIVED" ? "danger" : "primary"}
        busy={busy}
        onConfirm={() => void changeStatus(confirmStatus ?? "")}
        onCancel={() => setConfirmStatus(null)}
      />

      <ConfirmDialog
        open={confirmBulkArchive}
        title={`Archive ${selected.size} enquir${selected.size === 1 ? "y" : "ies"}?`}
        description="Archived enquiries stay in the system but are removed from the main inbox view."
        confirmLabel="Archive now"
        busy={busy}
        onConfirm={() => void archiveSelected()}
        onCancel={() => setConfirmBulkArchive(false)}
      />
    </div>
  );
}
