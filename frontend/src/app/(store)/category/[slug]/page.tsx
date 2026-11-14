import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShopFallback, ShopView } from "@/components/store/shop-view";
import { getAllProducts, getCategories, getCategoryBySlug } from "@/lib/catalog";
import { breadcrumbJsonLd, jsonLd, pageMetadata, plainText } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return { title: "Category not found", robots: { index: false } };
  const intro = c.description ? `${plainText(c.description, 110).replace(/[.…\s]+$/, "")}. ` : "";
  return pageMetadata({
    title: `${c.name} — Shop Online in Pakistan`,
    description: `${intro}Shop ${c.name} online at AH Clothing Hub with Cash on Delivery across Pakistan.`,
    path: `/category/${c.slug}`,
    images: c.image?.url ? [{ url: c.image.url, alt: c.name }] : undefined,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, products, categories] = await Promise.all([getCategoryBySlug(slug), getAllProducts(), getCategories()]);
  if (!category) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([["Home", "/"], ["Shop", "/shop"], [category.name, `/category/${category.slug}`]]))} />
      <header className="relative overflow-hidden bg-[#141414] text-white">
        <Image src={category.image.url} alt="" fill priority sizes="100vw" className="object-cover object-[center_30%] opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="container-x relative flex min-h-[300px] flex-col justify-end pb-10 pt-20 md:min-h-[420px] md:pb-14">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/70">
            <Link href="/" className="hover:text-white">Home</Link> / <Link href="/shop" className="hover:text-white">Shop</Link> / <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="text-[48px] font-medium leading-none md:text-[80px]">{category.name}</h1>
          {category.description && <p className="mt-3 max-w-lg text-white/80">{category.description}</p>}
        </div>
      </header>
      <nav className="no-scrollbar container-x flex gap-2 overflow-x-auto py-5" aria-label="Categories">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} aria-current={c.slug === slug ? "page" : undefined} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${c.slug === slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-foreground"}`}>
            {c.name}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<ShopFallback products={products} categories={categories} fixedCategory={slug} />}>
        <ShopView products={products} categories={categories} fixedCategory={slug} />
      </Suspense>
    </>
  );
}
