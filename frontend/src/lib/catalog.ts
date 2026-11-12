/**
 * Catalog data access. Uses Firestore when configured, otherwise demo data.
 * Safe to call from server components and client components.
 */
import type { Category, PagesContent, Product, Review, StoreSettings } from "./types";
import { DUMMY_CATEGORIES, DUMMY_PAGES, DUMMY_PRODUCTS, DUMMY_REVIEWS, DUMMY_SETTINGS } from "./dummy-data";

export type ProductQuery = {
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  filter?: "new" | "bestsellers" | "featured" | "sale";
  q?: string;
  sort?: "newest" | "popular" | "price-asc" | "price-desc";
};

export const effectivePrice = (p: Pick<Product, "price" | "salePrice">) => p.salePrice ?? p.price;

export async function getAllProducts(): Promise<Product[]> {
  return DUMMY_PRODUCTS.filter((p) => p.active);
}

export function filterProducts(products: Product[], q: ProductQuery): Product[] {
  let list = [...products];
  if (q.category) list = list.filter((p) => p.categorySlug === q.category);
  if (q.filter === "new") list = list.filter((p) => p.newArrival);
  if (q.filter === "bestsellers") list = list.filter((p) => p.bestSeller);
  if (q.filter === "featured") list = list.filter((p) => p.featured);
  if (q.filter === "sale" || q.onSale) list = list.filter((p) => p.salePrice != null);
  if (q.sizes?.length) list = list.filter((p) => p.variants.some((v) => q.sizes!.includes(v.size) && v.stock > 0));
  if (q.colors?.length) list = list.filter((p) => p.colors.some((c) => q.colors!.includes(c.name)));
  if (q.minPrice != null) list = list.filter((p) => effectivePrice(p) >= q.minPrice!);
  if (q.maxPrice != null) list = list.filter((p) => effectivePrice(p) <= q.maxPrice!);
  if (q.inStock) list = list.filter((p) => p.totalStock > 0);
  if (q.q) {
    const term = q.q.toLowerCase();
    list = list.filter((p) => [p.name, p.categorySlug, ...p.tags].join(" ").toLowerCase().includes(term));
  }
  switch (q.sort) {
    case "popular": list.sort((a, b) => b.soldCount - a.soldCount); break;
    case "price-asc": list.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
    case "price-desc": list.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
    default: list.sort((a, b) => b.createdAt - a.createdAt);
  }
  return list;
}

export async function getProducts(q: ProductQuery = {}) {
  return filterProducts(await getAllProducts(), q);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getAllProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const all = await getAllProducts();
  return all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  return DUMMY_CATEGORIES.filter((c) => c.active).sort((a, b) => a.order - b.order);
}

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  return DUMMY_REVIEWS.filter((r) => r.productId === productId && r.status === "approved").sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSettings(): Promise<StoreSettings> {
  return DUMMY_SETTINGS;
}

export async function getPages(): Promise<PagesContent> {
  return DUMMY_PAGES;
}
