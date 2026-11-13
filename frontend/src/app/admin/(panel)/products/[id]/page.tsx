"use client";
import Link from "next/link";
import { use } from "react";
import { Package } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, EmptyBlock, FullLoader } from "@/components/admin/ui";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products, categories, costsReady } = useAdminData();
  if (!products || !categories || !costsReady) return <FullLoader label="Loading product…" />;
  const product = products.find((p) => p.id === id);
  if (!product)
    return <EmptyBlock icon={Package} title="Product not found" description="It may have been deleted." action={<AButton asChild variant="subtle"><Link href="/admin/products">Back to products</Link></AButton>} />;
  // key → re-initialise the form when switching products
  return <ProductForm key={product.id} product={product} />;
}
