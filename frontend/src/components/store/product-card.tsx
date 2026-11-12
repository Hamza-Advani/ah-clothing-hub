"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Price, Rating } from "@/components/ui/misc";
import { useWishlist } from "@/store/wishlist";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useMounted } from "@/hooks/use-mounted";
import { cn, discountPercent } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { EASE } from "./reveal";

export function ProductCard({ product, index = 0, priority }: { product: Product; index?: number; priority?: boolean }) {
  const mounted = useMounted();
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const [quick, setQuick] = useState(false);
  const [img0, img1] = [...product.images].sort((a, b) => a.order - b.order);
  const soldOut = product.totalStock <= 0;
  const off = discountPercent(product.price, product.salePrice);
  const color = product.colors[0]?.name ?? "";

  const quickAdd = (size: string) => {
    const v = product.variants.find((x) => x.size === size && x.color === color);
    if (!v || v.stock <= 0) return;
    add({ productId: product.id, slug: product.slug, name: product.name, image: img0.url, price: product.price, salePrice: product.salePrice, size, color, maxStock: v.stock });
    setQuick(false);
    toast.success("Added to bag", { description: `${product.name} · ${size}`, action: { label: "View bag", onClick: () => setCartOpen(true) } });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: EASE }}
      className="group relative"
      onMouseLeave={() => setQuick(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-muted">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          <Image
            src={img0.url}
            alt={img0.alt || product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover transition duration-[900ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]", img1 && "group-hover:opacity-0", soldOut && "opacity-70")}
          />
          {img1 && (
            <Image src={img1.url} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="scale-[1.04] object-cover opacity-0 transition duration-[900ms] ease-[var(--ease-luxe)] group-hover:scale-100 group-hover:opacity-100" />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {soldOut ? <Badge variant="soldout">Sold out</Badge> : off > 0 ? <Badge variant="sale">−{off}%</Badge> : null}
          {product.newArrival && !soldOut && <Badge variant="new">New</Badge>}
          {product.bestSeller && !soldOut && !product.newArrival && <Badge variant="bestseller">Bestseller</Badge>}
        </div>

        <button
          onClick={() => {
            const added = toggle(product.id);
            toast(added ? "Saved to wishlist" : "Removed from wishlist");
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={mounted && wished}
          className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-background/85 backdrop-blur transition hover:scale-110"
        >
          <Heart className={cn("size-4 transition", mounted && wished ? "fill-sale text-sale" : "text-foreground")} />
        </button>

        {!soldOut && (
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-3 opacity-0 transition duration-500 ease-[var(--ease-luxe)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100">
            {quick ? (
              <div className="glass rounded-[4px] p-2">
                <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Select size</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {product.sizes.map((s) => {
                    const st = product.variants.find((v) => v.size === s && v.color === color)?.stock ?? 0;
                    return (
                      <button key={s} disabled={st <= 0} onClick={() => quickAdd(s)} className="min-w-9 rounded-[2px] border border-border bg-surface px-2 py-1.5 text-xs font-semibold transition hover:border-foreground disabled:text-muted-foreground/50 disabled:line-through">
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button onClick={() => setQuick(true)} className="glass ml-auto flex h-10 items-center justify-center gap-1.5 rounded-full px-0 text-[11px] font-bold uppercase tracking-[0.16em] max-lg:size-10 lg:w-full lg:rounded-[4px]" aria-label={`Quick add ${product.name}`}>
                <Plus className="size-4" /> <span className="max-lg:sr-only">Quick add</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{product.categorySlug.replace(/-/g, " ")}</p>
          {product.reviewCount > 0 && <Rating value={product.rating} size={11} className="max-sm:hidden" />}
        </div>
        <h3 className="font-sans text-[14px] font-medium leading-snug md:text-[15px]">
          <Link href={`/product/${product.slug}`} className="line-clamp-1 hover:text-accent">{product.name}</Link>
        </h3>
        <Price price={product.price} salePrice={product.salePrice} />
        {product.colors.length > 1 && (
          <div className="flex gap-1.5 pt-1" aria-label={`${product.colors.length} colours`}>
            {product.colors.map((c) => (
              <span key={c.name} title={c.name} className="size-3 rounded-full border border-black/15" style={{ background: c.hex }} />
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[3/4] rounded-[6px]" />
      <div className="skeleton mt-4 h-3 w-1/3" />
      <div className="skeleton mt-2 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/4" />
    </div>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
      ))}
    </div>
  );
}
