import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopSkeleton, ShopView } from "@/components/store/shop-view";
import { PageHeader } from "@/components/ui/misc";
import { getAllProducts, getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse the full AH Clothing Hub collection — eastern, western, menswear, essentials and kids. Cash on Delivery across Pakistan.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  return (
    <>
      <PageHeader eyebrow="The collection" title="Shop all" description="Timeless pieces with a modern edge — delivered across Pakistan." />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopView products={products} categories={categories} />
      </Suspense>
    </>
  );
}
