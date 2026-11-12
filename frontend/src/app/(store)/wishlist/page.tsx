"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ProductGrid } from "@/components/store/product-card";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/hooks/use-mounted";
import { useStoreData } from "@/components/providers/store-data";

export default function WishlistPage() {
  const mounted = useMounted();
  const ids = useWishlist((s) => s.ids);
  const { products: all } = useStoreData();
  const products = mounted ? all.filter((p) => ids.includes(p.id)) : [];
  return (
    <>
      <PageHeader eyebrow="Saved for later" title="Wishlist" description={mounted && products.length ? `${products.length} piece${products.length > 1 ? "s" : ""} you love` : undefined} />
      <div className="container-x py-12 md:py-16">
        {!mounted ? null : products.length === 0 ? (
          <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any product to save it here for later." action={<Button asChild size="lg"><Link href="/shop">Explore the collection</Link></Button>} />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </>
  );
}
