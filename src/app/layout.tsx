import type { Metadata, Viewport } from "next";
import { cormorant, manrope } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Haji Queens — Modest & Contemporary Fashion | By Hazera Khawaja",
    template: "%s | Haji Queens",
  },
  description:
    "Haji Queens by Hazera Khawaja. Seven years of modest and contemporary fashion: abayas, maxis, Indo-Western sets and workwear.",
  keywords: [
    "modest fashion",
    "abayas",
    "maxi dresses",
    "indo western",
    "corporate wear",
    "Haji Queens",
    "Hazera Khawaja",
  ],
  openGraph: {
    title: "Haji Queens — Modest & Contemporary Fashion",
    description:
      "Thoughtfully curated fashion that celebrates individuality, confidence and timeless elegance.",
    url: SITE_URL,
    siteName: "Haji Queens",
    images: [{ url: "/images/og-storefront.jpg", width: 1200, height: 630, alt: "Haji Queens" }],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haji Queens — Modest & Contemporary Fashion",
    description:
      "Thoughtfully curated fashion that celebrates individuality, confidence and timeless elegance.",
    images: ["/images/og-storefront.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f8f4ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${manrope.variable} font-sans antialiased bg-background text-foreground flex min-h-screen flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
