import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { NavProgress } from "@/components/storefront/nav-progress";
import { NoticeRegion } from "@/components/storefront/notice";
import { MetaPixelListener } from "@/lib/pixel";
import { getCategories, getContent } from "@/lib/data";
import { hanken, newsreader, wordmark } from "@/lib/fonts";
import "./store.css";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, announcement] = await Promise.all([
    getCategories(),
    getContent<{ text: string; href?: string; enabled?: boolean } | null>("announcement", null),
  ]);

  return (
    <div className={`hq ${newsreader.variable} ${hanken.variable} ${wordmark.variable}`}>
      <NavProgress />
      <Header announcement={announcement} categories={categories} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer categories={categories} />
      <CartDrawer />
      <WhatsAppFloat />
      <CookieConsent />
      <NoticeRegion />
      <MetaPixelListener />
    </div>
  );
}
