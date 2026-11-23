/** Plain-language labels and allowed admin workflows. Shared by UI and services. */

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "New order",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** A status can only move forward through these steps. Same-status no-ops are allowed. */
export const ORDER_NEXT_STATUSES: Record<string, readonly string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Awaiting payment",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const INQUIRY_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "SCHEDULED",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  IN_REVIEW: "Reviewing",
  SCHEDULED: "Consultation set",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const INQUIRY_NEXT_STATUSES: Record<string, readonly string[]> = {
  NEW: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["SCHEDULED", "COMPLETED", "ARCHIVED"],
  SCHEDULED: ["COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: ["NEW"],
};

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  live: "Live in store",
  hidden: "Hidden",
  pending: "Pending approval",
  enquiry: "Enquiry only",
};
