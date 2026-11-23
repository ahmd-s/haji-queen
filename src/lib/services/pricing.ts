import type { Product, ProductVariant, ShippingRule } from "@prisma/client";
import { parseJson } from "@/lib/types";
import { shippingFor } from "@/lib/site";
import { ServiceError } from "@/lib/services/errors";

export type QuoteInputLine = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

export type PricedProduct = Product & {
  variants: ProductVariant[];
  shippingRule?: ShippingRule | null;
};

export type QuoteLine = {
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  trackStock: boolean;
  shippingRule: ShippingRule | null;
};

export type OrderQuote = {
  lines: QuoteLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  shippingRuleId: string | null;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Product-specific rules win when configured; mixed carts use the highest
 * applicable flat fee so the server never under-charges. With no rules, the
 * existing global shipping calculation is preserved exactly.
 */
export function shippingFeeFor(subtotal: number, rules: Array<ShippingRule | null>): number {
  const active = new Map<string, ShippingRule>();
  for (const rule of rules) {
    if (rule?.isActive) active.set(rule.id, rule);
  }
  if (active.size === 0) return shippingFor(subtotal);

  let fee = 0;
  for (const rule of active.values()) {
    const free = rule.freeThreshold !== null && subtotal >= rule.freeThreshold;
    fee = Math.max(fee, free ? 0 : rule.flatFee);
  }
  return roundMoney(fee);
}

/**
 * Server-side price truth. Client prices are never accepted: every unit price
 * is read from the product and variant rows inside the order transaction.
 */
export function buildOrderQuote(
  productsById: Map<string, PricedProduct>,
  items: QuoteInputLine[]
): OrderQuote {
  const lines: QuoteLine[] = [];

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product || !product.visible) {
      throw new ServiceError("UNAVAILABLE", "A product in your bag is no longer available.");
    }
    if (!product.priceConfirmed || product.price <= 0) {
      throw new ServiceError(
        "UNAVAILABLE",
        `${product.name}: price to be announced. Please enquire instead.`
      );
    }

    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color && v.isActive
    );
    if (!variant) {
      throw new ServiceError(
        "UNAVAILABLE",
        `Please choose an available size and colour for ${product.name}.`
      );
    }

    const extra = Number.isFinite(variant.extraPrice) ? Math.max(0, variant.extraPrice) : 0;
    const unitPrice = roundMoney(product.price + extra);
    const images = parseJson<string[]>(product.images, []);
    const shippingRule = product.shippingRule ?? null;

    lines.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: images[0] ?? null,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice,
      lineTotal: roundMoney(unitPrice * item.quantity),
      trackStock: product.trackStock,
      shippingRule,
    });
  }

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shippingFee = shippingFeeFor(
    subtotal,
    lines.map((line) => line.shippingRule)
  );
  const total = roundMoney(subtotal + shippingFee);
  const activeRules = new Map<string, ShippingRule>();
  for (const line of lines) {
    if (line.shippingRule?.isActive) activeRules.set(line.shippingRule.id, line.shippingRule);
  }
  const shippingRuleId = activeRules.size === 1 ? [...activeRules.keys()][0] : null;

  return {
    lines,
    subtotal,
    shippingFee,
    total,
    currency: "INR",
    shippingRuleId,
  };
}
