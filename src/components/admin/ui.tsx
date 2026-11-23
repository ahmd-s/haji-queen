"use client";

import { useEffect, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pagination } from "@/lib/admin-types";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const BADGE_STYLES: Record<BadgeTone, string> = {
  neutral: "border-border bg-cream text-espresso/75",
  success: "border-gold/30 bg-gold/10 text-gold-deep",
  warning: "border-amber-500/30 bg-amber-50 text-amber-800",
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  info: "border-espresso/15 bg-espresso/5 text-espresso/80",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.11em]",
        BADGE_STYLES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl text-espresso sm:text-[34px]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-taupe">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("border border-border bg-white", className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-cream/30 px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-espresso">{title}</h2>
            {description ? <p className="mt-1 text-[12px] leading-relaxed text-taupe">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn(title ? "p-5" : "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex flex-wrap items-end gap-3 border border-border bg-white p-3">
      {children}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="min-w-[220px] flex-1">
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="field-hq h-9 w-full !pl-9 text-[12.5px]"
        />
      </span>
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[150px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-hq h-9 text-[12.5px]"
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="field-label">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="mt-1 block text-[11px] leading-relaxed text-taupe">{hint}</span> : null}
      {error ? (
        <span className="mt-1 flex items-start gap-1 text-[11px] font-medium text-destructive">
          <CircleAlert className="mt-px h-3 w-3 shrink-0" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function CheckRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 border border-border bg-white p-3 text-[12.5px] text-espresso",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-gold"
      />
      <span>
        <span className="block font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] leading-relaxed text-taupe">{hint}</span> : null}
      </span>
    </label>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center bg-cream text-gold">
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.5} />}
      </span>
      <p className="font-display text-xl text-espresso">{title}</p>
      {description ? <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-taupe">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 border border-border bg-white px-5 py-12 text-[13px] text-taupe">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-destructive/25 bg-destructive/5 px-5 py-4 text-[13px] text-destructive">
      <span className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border border-destructive/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-destructive hover:text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function AdminTableScroll({
  children,
  minWidth = 720,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto border border-border bg-white">
      <table className="w-full text-left text-[13px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableHeadRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border bg-cream/40 text-[10.5px] uppercase tracking-[0.14em] text-taupe">
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
  right,
}: {
  children?: ReactNode;
  className?: string;
  right?: boolean;
}) {
  return (
    <th className={cn("px-4 py-3 font-semibold", right && "text-right", className)}>{children}</th>
  );
}

export function Td({
  children,
  className,
  right,
}: {
  children?: ReactNode;
  className?: string;
  right?: boolean;
}) {
  return (
    <td className={cn("border-b border-border/70 px-4 py-3 align-middle last:border-0", right && "text-right", className)}>
      {children}
    </td>
  );
}

export function PaginationBar({
  pagination,
  onChange,
}: {
  pagination: Pagination;
  onChange: (page: number) => void;
}) {
  const { page, totalPages, total, pageSize } = pagination;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12px] text-taupe">
      <span>
        Showing <strong className="font-semibold text-espresso">{from}–{to}</strong> of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center border border-border text-espresso disabled:cursor-not-allowed disabled:opacity-40 hover:border-gold hover:text-gold"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[70px] text-center text-espresso">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center border border-border text-espresso disabled:cursor-not-allowed disabled:opacity-40 hover:border-gold hover:text-gold"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-espresso/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md border border-border bg-ivory shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="confirm-title" className="font-display text-xl text-espresso">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-taupe hover:text-espresso disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-5 text-[13px] leading-relaxed text-espresso/75">
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-hq-outline !px-4 !py-2 !text-[11px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors disabled:opacity-50",
              tone === "danger" ? "bg-destructive hover:bg-destructive/85" : "bg-espresso hover:bg-gold hover:text-espresso"
            )}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-espresso/55 p-3 sm:p-6">
      <div className={cn("w-full bg-ivory shadow-2xl", wide ? "max-w-5xl" : "max-w-2xl")}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-2xl text-espresso">{title}</h2>
            {description ? <p className="mt-1 text-[12px] text-taupe">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-taupe hover:text-espresso"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-taupe hover:text-gold"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </a>
  );
}

export function BulkBar({
  count,
  children,
  onClear,
}: {
  count: number;
  children: ReactNode;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-gold/30 bg-champagne/30 px-4 py-3">
      <p className="text-[12.5px] font-medium text-espresso">
        {count} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onClear}
          className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-taupe hover:text-espresso"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export function SmallButton({
  children,
  onClick,
  disabled,
  tone = "default",
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        tone === "primary"
          ? "border-espresso bg-espresso text-ivory hover:bg-gold hover:text-espresso"
          : tone === "danger"
            ? "border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
            : "border-border text-espresso hover:border-gold hover:text-gold",
        className
      )}
    >
      {children}
    </button>
  );
}
