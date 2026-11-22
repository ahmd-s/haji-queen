import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/policy-content";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Haji Queens shipping and delivery information.",
};

export default function ShippingPolicyPage() {
  return <PolicyPage slug="shipping-policy" />;
}
