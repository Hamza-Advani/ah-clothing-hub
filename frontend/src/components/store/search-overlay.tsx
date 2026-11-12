"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Search, TrendingUp, X } from "lucide-react";
import { useUI } from "@/store/ui";
import { filterProducts } from "@/lib/catalog";
import { Price } from "@/components/ui/misc";
import type { Product } from "@/lib/types";

const TRENDING = ["Lawn 3-piece", "Kurta", "Suit", "Dress", "Jeans", "Kids"];

export function SearchOverlay({ products }: { products: Product[] }) {
  const { searchOpen, setSearchOpen } = useUI();
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const results = useMemo(() => {
    const term = dq.trim();
    if (term.length < 2) return [];
    // match each word so "red dress" works
    return term
      .split(/\s+/)
      .reduce((list, word) => filterProducts(list, { q: word, sort: "popular" }), products)
      .slice(0, 6);
  }, [dq, products]);

  const go = (term: string) => {
    setSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <Dialog.Root open={searchOpen} onOpenChange={(v) => { setSearchOpen(v); if (!v) setQ(""); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm data-[state=open]:animate-[fade-in_.25s_ease]" />
        <Dialog.Content
          onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
          className="fixed inset-x-0 top-0 z-[90] max-h-[100dvh] overflow-y-auto bg-background shadow-lift outline-none data-[state=open]:animate-[fade-in_.25s_ease]"
        >
          <Dialog.Title className="sr-only">Search products</Dialog.Title>
          <Dialog.Description className="sr-only">Type to see instant product suggestions</Dialog.Description>
          <div className="container-x py-5 md:py-8">
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()); }} className="flex items-center gap-3 border-b-2 border-foreground pb-3">
              <Search className="size-6 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground/60 md:text-4xl"
                aria-label="Search"
                autoComplete="off"
              />
              <Dialog.Close className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted" aria-label="Close search">
                <X className="size-5" />
              </Dialog.Close>
            </form>

            {dq.trim().length < 2 ? (
              <div className="py-8">
                <p className="eyebrow mb-4 flex items-center gap-2 text-muted-foreground"><TrendingUp className="size-3.5" /> Trending searches</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => go(t)} className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition hover:border-foreground">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No results for “{dq}”. Try “kurta”, “dress” or “suit”.</p>
            ) : (
              <div className="py-6">
                <p className="eyebrow mb-4 text-muted-foreground">Products</p>
                <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link href={`/product/${p.slug}`} onClick={() => setSearchOpen(false)} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-muted">
                          <Image src={p.images[0]?.url} alt={p.name} fill sizes="(max-width:768px) 45vw, 15vw" className="object-cover transition duration-700 group-hover:scale-105" />
                        </div>
                        <p className="mt-2 line-clamp-1 text-sm font-medium">{p.name}</p>
                        <Price price={p.price} salePrice={p.salePrice} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={() => go(dq.trim())} className="group mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]">
                  See all results for “{dq}” <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
