"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { adminFetch, errorMessage } from "@/components/admin/api";
import {
  AdminBadge,
  AdminCard,
  AdminPageHeader,
  AdminTableScroll,
  ErrorState,
  LoadingState,
  SmallButton,
  Td,
  Th,
  TableHeadRow,
} from "@/components/admin/ui";
import type { ShippingRuleRow } from "@/lib/admin-types";
import { formatINR } from "@/lib/money";

type SettingsData = {
  siteUrl: string;
  role: string;
  shippingRules: ShippingRuleRow[];
  catalog: {
    products: number;
    activeVariants: number;
    lowStockVariants: number;
    pendingPrices: number;
    enquiryOnly: number;
  };
  integrations: { payments: boolean; email: boolean; objectStorage: boolean };
  note: string;
};

function ConnectionRow({ label, ready, hint }: { label: string; ready: boolean; hint: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 py-3 last:border-0">
      <div>
        <p className="text-[12.5px] font-medium text-espresso">{label}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-taupe">{hint}</p>
      </div>
      <AdminBadge tone={ready ? "success" : "warning"}>
        {ready ? "Configured" : "Not connected"}
      </AdminBadge>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<SettingsData>("/api/admin/settings"));
    } catch (err) {
      setError(errorMessage(err, "Settings could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Settings"
        description="A safe, read-only view of how the store is set up. Secrets are never shown here — they live in the hosting environment."
        actions={
          <SmallButton onClick={() => void load()} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </SmallButton>
        }
      />

      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <LoadingState label="Loading settings…" /> : null}

        {data ? (
          <div className="space-y-5">
            <AdminCard
              title="Store & access"
              description="Where customers reach the store and which admin permissions your account has."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-border bg-cream/30 p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-taupe">
                    Website address
                  </p>
                  <p className="mt-1 break-all text-[13px] text-espresso">{data.siteUrl}</p>
                  <a
                    href={data.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold hover:underline"
                  >
                    Open store <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="border border-border bg-cream/30 p-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-taupe">
                    Your admin role
                  </p>
                  <p className="mt-1 text-[13px] text-espresso">{data.role.replace(/_/g, " ")}</p>
                  <Link
                    href="/admin/security"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold hover:underline"
                  >
                    <ShieldCheck className="h-3 w-3" /> Change password
                  </Link>
                </div>
              </div>
            </AdminCard>

            <AdminCard
              title="Catalogue snapshot"
              description="Quick counts to help you spot anything that still needs attention before launch."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ["Products", data.catalog.products],
                  ["Active options", data.catalog.activeVariants],
                  ["Low stock", data.catalog.lowStockVariants],
                  ["Price pending", data.catalog.pendingPrices],
                  ["Enquiry only", data.catalog.enquiryOnly],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-border bg-white p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-taupe">
                      {label}
                    </p>
                    <p className="mt-1 font-display text-2xl text-espresso">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.catalog.lowStockVariants > 0 ? (
                  <Link
                    href="/admin/inventory"
                    className="inline-flex items-center justify-center gap-1.5 border border-espresso bg-espresso px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory hover:bg-gold hover:text-espresso"
                  >
                    Review low stock
                  </Link>
                ) : null}
                {data.catalog.pendingPrices > 0 ? (
                  <Link
                    href="/admin/products"
                    className="inline-flex items-center justify-center gap-1.5 border border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso hover:border-gold hover:text-gold"
                  >
                    Confirm prices
                  </Link>
                ) : null}
              </div>
            </AdminCard>

            <AdminCard
              title="Shipping rules"
              description="Flat fees and free-shipping thresholds are applied by the server when an order is placed — never from the browser."
            >
              {data.shippingRules.length === 0 ? (
                <p className="border border-dashed border-border bg-white px-4 py-6 text-center text-[12.5px] text-taupe">
                  No shipping rules are configured yet.
                </p>
              ) : (
                <AdminTableScroll minWidth={640}>
                  <thead>
                    <TableHeadRow>
                      <Th>Rule</Th>
                      <Th>Flat fee</Th>
                      <Th>Free above</Th>
                      <Th>Products</Th>
                      <Th>Status</Th>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {data.shippingRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-border/70 last:border-0">
                        <Td>
                          <p className="font-medium text-espresso">{rule.name}</p>
                          {rule.description ? (
                            <p className="text-[11px] text-taupe">{rule.description}</p>
                          ) : null}
                        </Td>
                        <Td>{formatINR(rule.flatFee)}</Td>
                        <Td>
                          {rule.freeThreshold === null ? "—" : formatINR(rule.freeThreshold)}
                        </Td>
                        <Td>{rule.productCount}</Td>
                        <Td>
                          <AdminBadge tone={rule.isActive ? "success" : "neutral"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </AdminBadge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTableScroll>
              )}
            </AdminCard>

            <AdminCard
              title="Connected services"
              description="These integrations are configured with environment variables by your developer. Green means credentials are present — it does not guarantee they are valid."
            >
              <div className="space-y-0">
                <ConnectionRow
                  label="Online payments"
                  ready={data.integrations.payments}
                  hint="Razorpay keys. Orders stay 'awaiting payment' until a verified payment is recorded."
                />
                <ConnectionRow
                  label="Email notifications"
                  ready={data.integrations.email}
                  hint="Resend or SMTP settings for order and enquiry confirmations."
                />
                <ConnectionRow
                  label="Photo storage"
                  ready={data.integrations.objectStorage}
                  hint="Blob or S3 storage for uploaded product and reference photos."
                />
              </div>
              <p className="mt-4 flex items-start gap-2 border border-border bg-cream/40 px-4 py-3 text-[12px] leading-relaxed text-taupe">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {data.note}
              </p>
            </AdminCard>

            <div className="flex items-start gap-2 border border-gold/30 bg-champagne/30 px-4 py-3 text-[12.5px] leading-relaxed text-espresso/75">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              <p>
                Everything in this panel is saved immediately when you confirm an action. If you
                need to undo a change, check the <Link href="/admin/audit" className="font-semibold text-gold hover:underline">activity log</Link>.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
