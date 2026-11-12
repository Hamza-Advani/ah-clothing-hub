import { HeroSlider } from "@/components/store/hero-slider";
import { CategoryShowcase, EditorialSplit, ProductSection, SaleBanner, Testimonials, TrustBadges } from "@/components/store/home-sections";
import { NewsletterForm } from "@/components/store/newsletter";
import { Reveal } from "@/components/store/reveal";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { HOME_TESTIMONIALS } from "@/lib/dummy-data";
import { discountPercent } from "@/lib/utils";

export default async function HomePage() {
  const [settings, categories, newArrivals, bestSellers, sale, featured] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ filter: "new", sort: "newest" }),
    getProducts({ filter: "bestsellers", sort: "popular" }),
    getProducts({ filter: "sale", sort: "popular" }),
    getProducts({ filter: "featured" }),
  ]);
  const maxOff = Math.max(0, ...sale.map((p) => discountPercent(p.price, p.salePrice)));

  return (
    <>
      <HeroSlider banners={settings.heroBanners} />
      <TrustBadges freeDeliveryThreshold={settings.freeDeliveryThreshold} />
      <CategoryShowcase categories={categories} />
      <ProductSection eyebrow="Just landed" title="New arrivals" href="/shop?filter=new" products={newArrivals.slice(0, 8)} />
      <SaleBanner image={sale[0]?.images[0]?.url ?? settings.heroBanners[0].image} maxOff={maxOff || 30} />
      <ProductSection eyebrow="Most loved" title="Best sellers" href="/shop?filter=bestsellers" products={bestSellers.slice(0, 8)} muted />
      <EditorialSplit image={settings.heroBanners[0].image} image2={featured[1]?.images[0]?.url ?? settings.heroBanners[1].image} />
      <ProductSection eyebrow="Editor's picks" title="Featured pieces" href="/shop?filter=featured" products={featured.slice(0, 8)} />
      <ProductSection eyebrow="Limited time" title="On sale now" href="/shop?filter=sale" products={sale.slice(0, 8)} muted />
      <Testimonials items={HOME_TESTIMONIALS} />
      <section className="bg-[#141414] text-[#faf7f2]">
        <Reveal className="container-x flex flex-col items-center py-16 text-center md:py-24">
          <p className="eyebrow mb-4 text-accent">The AH Circle</p>
          <h2 className="max-w-2xl text-[38px] font-medium leading-[1.05] md:text-[58px]">
            Early access, private sales & <em className="font-normal text-[#e6d3b0]">10% off</em> your first order
          </h2>
          <div className="mt-10 w-full max-w-md">
            <NewsletterForm dark />
          </div>
          <p className="mt-4 text-xs text-white/50">No spam, ever. Unsubscribe anytime.</p>
        </Reveal>
      </section>
    </>
  );
}
