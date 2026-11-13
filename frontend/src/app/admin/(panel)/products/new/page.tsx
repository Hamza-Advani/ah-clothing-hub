"use client";
import { ProductForm } from "@/components/admin/product-form";
import { useAdminData } from "@/components/admin/admin-data";
import { FullLoader } from "@/components/admin/ui";

export default function NewProductPage() {
  const { categories } = useAdminData();
  if (!categories) return <FullLoader />;
  return <ProductForm />;
}
