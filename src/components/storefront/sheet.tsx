"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drawer / modal on the native <dialog> element: the browser supplies focus
 * trapping, Escape handling, focus return and an inert page behind it.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "top" | "center" | "full";
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={cn("sheet", `sheet-${side}`, className)}
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-inner">{children}</div>
    </dialog>
  );
}

export function SheetHeader({
  title,
  onClose,
  closeLabel,
}: {
  title: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-sand py-4 pl-6 pr-3">
      <h2 className="t-sub">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="inline-flex size-11 items-center justify-center"
      >
        <X className="size-5" strokeWidth={1.4} />
      </button>
    </div>
  );
}
