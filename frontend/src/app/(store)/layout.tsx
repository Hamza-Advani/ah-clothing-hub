import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { SearchOverlay } from "@/components/store/search-overlay";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { StoreDataProvider } from "@/components/providers/store-data";
import { getAllProducts, getCategories, getSettings } from "@/lib/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, products] = await Promise.all([getSettings(), getCategories(), getAllProducts()]);
  return (
    <StoreDataProvider value={{ settings, categories, products }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <AnnouncementBar messages={settings.announcement} />
      <Header categories={categories} logoUrl={settings.logo} whatsapp={settings.whatsapp} />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer freeDeliveryThreshold={settings.freeDeliveryThreshold} />
      <SearchOverlay products={products} />
      <WhatsAppButton number={settings.whatsapp} storeName={settings.storeName} />
    </StoreDataProvider>
  );
}
