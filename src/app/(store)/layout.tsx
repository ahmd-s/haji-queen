import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { MetaPixelListener } from "@/lib/pixel";
import { getCategories, getContent } from "@/lib/data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, announcement] = await Promise.all([
    getCategories(),
    getContent<{ text: string; href?: string; enabled?: boolean } | null>("announcement", null),
  ]);

  return (
    <>
      <Header announcement={announcement} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
      <CartDrawer />
      <WhatsAppFloat />
      <CookieConsent />
      <MetaPixelListener />
    </>
  );
}
