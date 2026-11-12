import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductInfo } from "@/components/store/product-info";
import { ReviewsSection } from "@/components/store/reviews-section";
import { ProductRail } from "@/components/store/product-rail";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { SectionHeading } from "@/components/ui/misc";
import { getAllProducts, getProductBySlug, getProductReviews, getRelatedProducts, getSettings } from "@/lib/catalog";

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Product not found" };
  const desc = p.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, images: p.images.slice(0, 1).map((i) => ({ url: i.url, width: 1200, height: 1600, alt: p.name })) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, reviews, settings] = await Promise.all([getRelatedProducts(product, 8), getProductReviews(product.id), getSettings()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.description.replace(/<[^>]+>/g, " ").trim(),
    sku: product.sku,
    brand: { "@type": "Brand", name: settings.storeName },
    aggregateRating: product.reviewCount ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.salePrice ?? product.price,
      availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pb-8 pt-0 md:py-10">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />
          <ProductInfo product={product} freeDeliveryThreshold={settings.freeDeliveryThreshold} deliveryCharge={settings.deliveryCharge} />
        </div>
      </div>
      <ReviewsSection productId={product.id} productSlug={product.slug} reviews={reviews} rating={product.rating} count={product.reviewCount} />
      {related.length > 0 && (
        <section className="bg-muted/60 py-16 md:py-24">
          <div className="container-x">
            <SectionHeading eyebrow="Complete the look" title="You may also like" href={`/category/${product.categorySlug}`} />
            <ProductRail products={related} />
          </div>
        </section>
      )}
      <RecentlyViewed current={product} />
    </>
  );
}
