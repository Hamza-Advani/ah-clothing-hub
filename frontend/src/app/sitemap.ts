import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

/** Only canonical, indexable URLs: home, shop, info pages, active categories and active products. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const stamp = (p: { updatedAt?: number; createdAt: number }) => p.updatedAt ?? p.createdAt;
  const latest = products.reduce((m, p) => Math.max(m, stamp(p)), 0);
  const catalogUpdated = latest ? new Date(latest) : undefined;
  const lastModFor = (slug: string) => {
    const t = products.filter((p) => p.categorySlug === slug).reduce((m, p) => Math.max(m, stamp(p)), 0);
    return t ? new Date(t) : undefined;
  };

  const page = (path: string, priority: number, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly",
    priority,
  });

  return [
    page("/", 1, catalogUpdated),
    page("/shop", 0.9, catalogUpdated),
    ...categories.map((c) => page(`/category/${c.slug}`, 0.8, lastModFor(c.slug))),
    ...products.map((p) => page(`/product/${p.slug}`, 0.7, stamp(p) ? new Date(stamp(p)) : undefined)),
    ...["/about", "/contact", "/faq", "/returns", "/privacy", "/terms"].map((p) => page(p, 0.4)),
  ];
}
