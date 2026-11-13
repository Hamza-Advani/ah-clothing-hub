import type { Product } from "@/lib/types";

/** Shape accepted by POST/PUT /api/admin/products (backend re-validates with zod). */
export type ProductPayload = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  tags: string[];
  price: number;
  salePrice: number | null;
  costPrice: number;
  sku: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: { size: string; color: string; stock: number }[];
  images: { url: string; publicId: string; order: number; alt?: string }[];
  weight?: number;
  material?: string;
  care?: string;
  active: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
};

export function toPayload(p: Product, costPrice: number): ProductPayload {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    categoryId: p.categoryId,
    categorySlug: p.categorySlug,
    tags: p.tags ?? [],
    price: p.price,
    salePrice: p.salePrice ?? null,
    costPrice,
    sku: p.sku ?? "",
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    variants: p.variants ?? [],
    images: (p.images ?? []).map((i, k) => ({ url: i.url, publicId: i.publicId ?? "", order: k, ...(i.alt ? { alt: i.alt } : {}) })),
    ...(p.weight != null ? { weight: p.weight } : {}),
    ...(p.material ? { material: p.material } : {}),
    ...(p.care ? { care: p.care } : {}),
    active: p.active,
    featured: !!p.featured,
    newArrival: !!p.newArrival,
    bestSeller: !!p.bestSeller,
  };
}

export function duplicatePayload(p: Product, costPrice: number, existingSlugs: Set<string>): ProductPayload {
  let n = 1;
  let slug = `${p.slug}-copy`;
  while (existingSlugs.has(slug)) slug = `${p.slug}-copy-${++n}`;
  // images are shared by URL; publicId cleared so deleting the copy never deletes the original's files
  return { ...toPayload(p, costPrice), name: `${p.name} (Copy)`, slug, sku: p.sku ? `${p.sku}-C` : "", active: false, images: p.images.map((i, k) => ({ url: i.url, publicId: "", order: k })) };
}
