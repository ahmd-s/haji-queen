/**
 * Shared admin DTO types. These are used by authenticated admin routes and
 * the owner admin UI only; public storefront DTOs are defined separately.
 */

import type { Availability } from "@/lib/availability";

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminColor = {
  name: string;
  hex: string;
  hex2?: string;
  images?: string[];
  available?: boolean;
};

export type AdminVariant = {
  id?: string;
  sku?: string | null;
  size: string;
  color: string;
  stock: number;
  extraPrice: number;
  isActive: boolean;
  lowStockThreshold: number;
};

export type AdminProduct = {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  description: string;
  fabricDetails: string | null;
  careInstructions: string | null;
  categoryId: string;
  categoryName: string;
  source: "HQ_ORIGINAL" | "TRUSTED_SUPPLIER";
  price: number;
  compareAtPrice: number | null;
  colors: AdminColor[];
  sizes: string[];
  images: string[];
  sizeNotes: string | null;
  badge: string | null;
  featured: boolean;
  visible: boolean;
  stock: number;
  priceConfirmed: boolean;
  trackStock: boolean;
  availability: Availability;
  isEnquiryOnly: boolean;
  customSizingAllowed: boolean;
  readyToDispatch: boolean;
  preorderAllowed: boolean;
  catalogueBatch: string | null;
  reviewNotes: { field: string; note: string }[];
  variants: AdminVariant[];
  supplierEntry: {
    supplierName: string;
    wholesalePrice: number;
    markupPct: number;
  } | null;
};

export type AdminOrderStatusEvent = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef: string | null;
  customerNote: string | null;
  internalNotes: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  statusHistory?: AdminOrderStatusEvent[];
};

export type AdminInquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  preferredContact: string;
  garmentType: string;
  designNotes: string | null;
  colorPreference: string | null;
  sizingPreference: string;
  standardSize: string | null;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  shoulder: string | null;
  sleeveLength: string | null;
  armhole: string | null;
  dressLength: string | null;
  otherMeasurements: string | null;
  instructions: string | null;
  consultationDate: string | null;
  consultationTime: string | null;
  referenceImageUrl: string | null;
  consent: boolean;
  status: string;
  internalNotes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCustomerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  phoneKey: string | null;
  consentAt: string | null;
  createdAt: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
};

export type AdminCustomerDetail = AdminCustomerSummary & {
  orders: AdminOrder[];
};

export type InventoryRow = {
  variantId: string;
  variantSku: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  productSku: string | null;
  categoryName: string;
  size: string;
  color: string;
  stock: number;
  extraPrice: number;
  isActive: boolean;
  lowStockThreshold: number;
  trackStock: boolean;
  available: boolean;
};

export type StockMovementRow = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  delta: number;
  reason: string;
  actorId: string | null;
  note: string | null;
  orderNumber: string | null;
  createdAt: string;
};

export type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export type ShippingRuleRow = {
  id: string;
  name: string;
  description: string | null;
  flatFee: number;
  freeThreshold: number | null;
  isActive: boolean;
  productCount: number;
};
