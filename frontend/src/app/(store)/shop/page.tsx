import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ShopFallback, ShopView } from "@/components/store/shop-view";
import { PageHeader } from "@/components/ui/misc";
import { getAllProducts, getCategories } from "@/lib/catalog";

// Filter/sort/search URLs (?filter=, ?sort=, ?q=…) all point their canonical here, so only /shop is indexed.
export const metadata: Metadata = pageMetadata({
  title: "Shop All Clothing Online in Pakistan",
  description: "Browse the full AH Clothing Hub collection of eastern and western wear for women, men and kids. Filter by size, colour and price — Cash on Delivery across Pakistan.",
  path: "/shop",
});

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  return (
    <>
      <PageHeader eyebrow="The collection" title="Shop all" description="Timeless pieces with a modern edge — delivered across Pakistan." />
      <Suspense fallback={<ShopFallback products={products} categories={categories} />}>
        <ShopView products={products} categories={categories} />
      </Suspense>
    </>
  );
}
