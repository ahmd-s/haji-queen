import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/policy-content";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms governing the use of the Haji Queens online store.",
};

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
