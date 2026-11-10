import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Haji Queens collects, uses and protects your information.",
};

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" />;
}
