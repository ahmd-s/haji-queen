import { z } from "zod";
import { AVAILABILITY } from "@/lib/availability";
import { ServiceError } from "@/lib/services/errors";

const colorSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z.string().trim().min(4).max(20),
  hex2: z.string().trim().max(20).optional(),
  images: z.array(z.string().trim().min(1)).max(8).optional(),
  available: z.boolean().optional(),
});

const variantSchema = z.object({
  id: z.string().trim().min(1).optional(),
  sku: z.string().trim().max(80).nullable().optional(),
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  stock: z.number().int().min(0).max(9999),
  extraPrice: z.number().min(0).max(100000).default(0),
  isActive: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).max(999).default(2),
});

/** Admin-only product write contract. Browser never supplies order prices. */
export const adminProductWriteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().trim().min(10).max(4000),
  fabricDetails: z.string().trim().max(500).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  source: z.enum(["HQ_ORIGINAL", "TRUSTED_SUPPLIER"]),
  price: z.number().min(0).max(1000000),
  compareAtPrice: z.number().positive().max(1000000).nullable().optional(),
  colors: z.array(colorSchema).max(12),
  sizes: z.array(z.string().trim().min(1).max(20)).max(12),
  images: z.array(z.string().trim().min(1)).max(12),
  /** Legacy aggregate fallback used only when no variant grid is supplied. */
  stock: z.number().int().min(0).max(9999).default(0),
  sizeNotes: z.string().trim().max(1000).nullable().optional(),
  badge: z.string().trim().max(30).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  visible: z.boolean().default(false),
  priceConfirmed: z.boolean().default(true),
  isEnquiryOnly: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  availability: z.enum(AVAILABILITY).default("IN_STOCK"),
  customSizingAllowed: z.boolean().default(false),
  readyToDispatch: z.boolean().default(false),
  preorderAllowed: z.boolean().default(false),
  variants: z.array(variantSchema).max(144).default([]),
});

export type AdminProductWrite = z.infer<typeof adminProductWriteSchema>;

export type PublishCheckInput = Pick<
  AdminProductWrite,
  "name" | "description" | "price" | "priceConfirmed" | "isEnquiryOnly" | "images" | "sizes" | "colors"
>;

/**
 * Publish rules are shared by create, edit and bulk publish. A genuine
 * enquiry-only product may be visible without a price; a sellable product
 * needs a confirmed price, a photo, a description and a complete option grid.
 */
export function publishBlockers(p: PublishCheckInput, legacyEnquiryOnly = false): string[] {
  const blockers: string[] = [];
  // Only a genuine enquiry-only listing may be visible without a selling price.
  // "Pending approval" is a hidden working state, never a publish state.
  const enquiryOnly = p.isEnquiryOnly || legacyEnquiryOnly;
  if (p.name.trim().length < 2) blockers.push("a product name");
  if (p.description.trim().length < 10) blockers.push("a complete description");
  if (p.images.length === 0) blockers.push("at least one product photo");
  if (!enquiryOnly && p.sizes.length === 0) blockers.push("at least one size");
  if (!enquiryOnly) {
    if (!p.priceConfirmed) blockers.push("a confirmed selling price");
    else if (p.price <= 0) blockers.push("a selling price above zero");
  }
  return blockers;
}

export function assertPublishable(p: PublishCheckInput, legacyEnquiryOnly = false): void {
  const blockers = publishBlockers(p, legacyEnquiryOnly);
  if (blockers.length === 0) return;
  throw new ServiceError(
    "VALIDATION",
    `Cannot publish yet — add ${blockers.join(", ")}. Save it hidden while you finish, then publish.`
  );
}
