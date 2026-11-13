import { HeroSlider } from "@/components/store/hero-slider";
import { CategoryShowcase, EditorialSplit, ProductSection, SaleBanner, TrustBadges } from "@/components/store/home-sections";
import { NewsletterForm } from "@/components/store/newsletter";
import { Reveal } from "@/components/store/reveal";
import { getCategories, getProducts, getSettings } from "@/lib/catalog";
import { discountPercent } from "@/lib/utils";
import { BRAND_IMAGES } from "@/lib/defaults";
import Link from "next/link";

export default async function HomePage() {
  const [settings, categories, newArrivals, bestSellers, sale, featured] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ filter: "new", sort: "newest" }),
    getProducts({ filter: "bestsellers", sort: "popular" }),
    getProducts({ filter: "sale", sort: "popular" }),
    getProducts({ filter: "featured" }),
  ]);
  const heroImg = (i: number) => settings.heroBanners[i]?.image || BRAND_IMAGES[i % BRAND_IMAGES.length];
  const empty = !newArrivals.length && !bestSellers.length && !featured.length && !sale.length;
  const maxOff = Math.max(0, ...sale.map((p) => discountPercent(p.price, p.salePrice)));

  return (
    <>
      <HeroSlider banners={settings.heroBanners} />
      <TrustBadges freeDeliveryThreshold={settings.freeDeliveryThreshold} />
      <CategoryShowcase categories={categories} />
      <ProductSection eyebrow="Just landed" title="New arrivals" href="/shop?filter=new" products={newArrivals.slice(0, 8)} />
      {empty && (
        <section className="container-x py-16 text-center md:py-24">
          <p className="eyebrow mb-4 text-accent">Coming soon</p>
          <h2 className="mx-auto max-w-2xl text-[34px] font-medium leading-[1.1] md:text-[48px]">Our new collection is on its way</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">Join the list below to hear first when it drops, or message us on WhatsApp.</p>
          <Link href="/contact" className="mt-8 inline-flex h-12 items-center bg-primary px-8 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">Contact us</Link>
        </section>
      )}
      {sale.length > 0 && <SaleBanner image={sale[0]?.images[0]?.url ?? heroImg(0)} maxOff={maxOff} />}
      <ProductSection eyebrow="Most loved" title="Best sellers" href="/shop?filter=bestsellers" products={bestSellers.slice(0, 8)} muted />
      {!empty && <EditorialSplit image={heroImg(0)} image2={featured[1]?.images[0]?.url ?? heroImg(1)} />}
      <ProductSection eyebrow="Editor's picks" title="Featured pieces" href="/shop?filter=featured" products={featured.slice(0, 8)} />
      <ProductSection eyebrow="Limited time" title="On sale now" href="/shop?filter=sale" products={sale.slice(0, 8)} muted />
      <section className="bg-[#141414] text-[#faf7f2]">
        <Reveal className="container-x flex flex-col items-center py-16 text-center md:py-24">
          <p className="eyebrow mb-4 text-accent">The AH Circle</p>
          <h2 className="max-w-2xl text-[38px] font-medium leading-[1.05] md:text-[58px]">
            Be the first to see <em className="font-normal text-[#e6d3b0]">new arrivals</em>
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
