import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const statics = ["", "/shop", "/about", "/contact", "/faq", "/returns", "/privacy", "/terms"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
  return [
    ...statics,
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date(p.updatedAt ?? p.createdAt), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
