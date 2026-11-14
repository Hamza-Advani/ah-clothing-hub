import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { SearchOverlay } from "@/components/store/search-overlay";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { StoreDataProvider } from "@/components/providers/store-data";
import { getAllProducts, getCategories, getSettings } from "@/lib/catalog";
import { absoluteUrl, jsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import type { StoreSettings } from "@/lib/types";

/** Brand structured data built only from the owner's own Admin → Settings values (nothing invented). */
function brandJsonLd(s: StoreSettings) {
  const sameAs = Object.values(s.socials ?? {}).filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u));
  const orgId = `${SITE_URL}/#organization`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: s.storeName || SITE_NAME,
      alternateName: ["AH Clothing", "AH Clothing Hub Pakistan"],
      url: SITE_URL,
      inLanguage: "en-PK",
      publisher: { "@id": orgId },
    },
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "@id": orgId,
      name: s.storeName || SITE_NAME,
      alternateName: "AH Clothing",
      url: SITE_URL,
      logo: s.logo || absoluteUrl("/icon.svg"),
      image: absoluteUrl("/opengraph-image"),
      description: "Online clothing store in Pakistan — eastern and western wear for women, men and kids, with Cash on Delivery nationwide.",
      areaServed: { "@type": "Country", name: "Pakistan" },
      currenciesAccepted: "PKR",
      ...(s.email ? { email: s.email } : {}),
      ...(s.phone ? { telephone: s.phone } : {}),
      // A full address (with commas/numbers) is a street address; a single word like "Karachi" is only the city.
      ...(s.address
        ? { address: { "@type": "PostalAddress", ...(/[,\d]/.test(s.address) ? { streetAddress: s.address } : { addressLocality: s.address.replace(/\b\w/g, (c) => c.toUpperCase()) }), addressCountry: "PK" } }
        : {}),
      ...(s.phone || s.whatsapp || s.email
        ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", areaServed: "PK", ...(s.phone || s.whatsapp ? { telephone: s.phone || s.whatsapp } : {}), ...(s.email ? { email: s.email } : {}) } }
        : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
  ];
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, products] = await Promise.all([getSettings(), getCategories(), getAllProducts()]);
  return (
    <StoreDataProvider value={{ settings, categories, products }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(brandJsonLd(settings))} />
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
