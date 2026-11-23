import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-api";
import { SITE_URL } from "@/lib/site";
import type { ShippingRuleRow } from "@/lib/admin-types";

/** GET — read-only operational settings snapshot. No secrets are returned. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;

  const [rules, products, activeVariants, lowStockVariants, pendingPrices, enquiryOnly] =
    await Promise.all([
      db.shippingRule.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      }),
      db.product.count(),
      db.productVariant.count({ where: { isActive: true } }),
      db.productVariant.count({
        where: { isActive: true, stock: { lte: 2 } },
      }),
      db.product.count({ where: { OR: [{ priceConfirmed: false }, { price: 0 }] } }),
      db.product.count({ where: { isEnquiryOnly: true } }),
    ]);

  const shippingRules: ShippingRuleRow[] = rules.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    flatFee: r.flatFee,
    freeThreshold: r.freeThreshold,
    isActive: r.isActive,
    productCount: r._count.products,
  }));

  return NextResponse.json({
    siteUrl: SITE_URL,
    role: guard.admin.role,
    shippingRules,
    catalog: {
      products,
      activeVariants,
      lowStockVariants,
      pendingPrices,
      enquiryOnly,
    },
    integrations: {
      payments: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      email: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      objectStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.S3_BUCKET),
    },
    note:
      "Payment, email and storage credentials are configured in hosting environment variables, not in this panel.",
  });
}
