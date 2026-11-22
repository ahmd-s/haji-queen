import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/policy-content";

export const metadata: Metadata = {
  title: "Returns & Exchange Policy",
  description: "Haji Queens returns and exchange information.",
};

export default function ReturnsPolicyPage() {
  return <PolicyPage slug="returns-policy" />;
}
