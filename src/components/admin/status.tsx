"use client";

import {
  INQUIRY_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PRODUCT_STATUS_LABEL,
} from "@/lib/admin-labels";
import { AdminBadge, type BadgeTone } from "@/components/admin/ui";

const ORDER_TONES: Record<string, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const PAYMENT_TONES: Record<string, BadgeTone> = {
  UNPAID: "warning",
  PAID: "success",
  REFUNDED: "neutral",
  FAILED: "danger",
};

const INQUIRY_TONES: Record<string, BadgeTone> = {
  NEW: "warning",
  IN_REVIEW: "info",
  SCHEDULED: "success",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

const PRODUCT_TONES: Record<string, BadgeTone> = {
  live: "success",
  hidden: "neutral",
  pending: "warning",
  enquiry: "info",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={ORDER_TONES[status] ?? "neutral"}>
      {ORDER_STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
    </AdminBadge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={PAYMENT_TONES[status] ?? "neutral"}>
      {PAYMENT_STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
    </AdminBadge>
  );
}

export function InquiryStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={INQUIRY_TONES[status] ?? "neutral"}>
      {INQUIRY_STATUS_LABEL[status] ?? status.replace(/_/g, " ")}
    </AdminBadge>
  );
}

export function ProductStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge tone={PRODUCT_TONES[status] ?? "neutral"}>
      {PRODUCT_STATUS_LABEL[status] ?? status}
    </AdminBadge>
  );
}

export function productStatusOf(p: {
  visible: boolean;
  priceConfirmed: boolean;
  isEnquiryOnly: boolean;
  catalogueBatch?: string | null;
}): string {
  if (p.isEnquiryOnly || (!p.priceConfirmed && p.catalogueBatch === "MASTER_V1_1")) return "enquiry";
  if (!p.priceConfirmed) return "pending";
  return p.visible ? "live" : "hidden";
}
