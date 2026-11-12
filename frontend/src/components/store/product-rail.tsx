"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";

/** Horizontal swipe rail on mobile, arrows on desktop. */
export function ProductRail({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="group/rail relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:-mx-8 md:gap-6 md:scroll-px-8 md:px-8">
        {products.map((p, i) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <>
          <button onClick={() => scroll(-1)} className="absolute -left-3 top-[38%] hidden size-11 place-items-center rounded-full border border-border bg-background shadow-soft transition hover:bg-foreground hover:text-background lg:grid" aria-label="Scroll left">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => scroll(1)} className="absolute -right-3 top-[38%] hidden size-11 place-items-center rounded-full border border-border bg-background shadow-soft transition hover:bg-foreground hover:text-background lg:grid" aria-label="Scroll right">
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}
