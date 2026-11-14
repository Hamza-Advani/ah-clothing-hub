import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductInfo } from "@/components/store/product-info";
import { ReviewsSection } from "@/components/store/reviews-section";
import { ProductRail } from "@/components/store/product-rail";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { SectionHeading } from "@/components/ui/misc";
import { getAllProducts, getCategoryBySlug, getProductBySlug, getProductReviews, getRelatedProducts, getSettings } from "@/lib/catalog";
import { absoluteUrl, breadcrumbJsonLd, jsonLd, ORG_ID, pageMetadata, plainText } from "@/lib/seo";
import { formatPKR } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const price = formatPKR(p.salePrice ?? p.price);
  const about = plainText(p.description, 105);
  const description = about
    ? `${about.replace(/[.…\s]+$/, "")}. ${price} — Cash on Delivery across Pakistan.`
    : `Buy ${p.name} online at AH Clothing Hub for ${price}. Cash on Delivery across Pakistan.`;
  return pageMetadata({
    title: p.name,
    description,
    path: `/product/${p.slug}`,
    images: p.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt || p.name })),
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, reviews, settings, category] = await Promise.all([getRelatedProducts(product, 8), getProductReviews(product.id), getSettings(), getCategoryBySlug(product.categorySlug)]);
  const categoryName = category?.name ?? product.categorySlug.replace(/-/g, " ");
  const url = absoluteUrl(`/product/${product.slug}`);
  const unitPrice = product.salePrice ?? product.price;
  const shippingRate = settings.freeDeliveryThreshold && unitPrice >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;

  // Only facts that are visible on the page / stored by the owner. Ratings appear only when approved reviews exist.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    image: product.images.map((i) => i.url),
    description: plainText(product.description, 5000) || product.name,
    sku: product.sku || undefined,
    category: categoryName,
    brand: { "@type": "Brand", name: settings.storeName },
    ...(product.material ? { material: product.material } : {}),
    ...(product.colors.length ? { color: product.colors.map((c) => c.name).join(", ") } : {}),
    ...(reviews.length && product.reviewCount
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.rating.toFixed(1)), reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 },
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.userName },
            datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.body,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: unitPrice,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": ORG_ID },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: shippingRate, currency: "PKR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
      },
    },
  };
  const crumbs = breadcrumbJsonLd([["Home", "/"], [categoryName, `/category/${product.categorySlug}`], [product.name, `/product/${product.slug}`]]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([productJsonLd, crumbs])} />
      <div className="container-x pb-8 pt-0 md:py-10">
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />
          <ProductInfo product={product} categoryName={categoryName} freeDeliveryThreshold={settings.freeDeliveryThreshold} deliveryCharge={settings.deliveryCharge} />
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
