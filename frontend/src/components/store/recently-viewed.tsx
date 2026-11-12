"use client";
import { useEffect, useMemo } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { ProductRail } from "./product-rail";
import { SectionHeading } from "@/components/ui/misc";
import type { Product } from "@/lib/types";

const KEY = "ah-recent";
const MAX = 8;

function read(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function RecentlyViewed({ current }: { current: Product }) {
  const mounted = useMounted();
  const items = useMemo(() => (mounted ? read().filter((p) => p.id !== current.id).slice(0, MAX) : []), [mounted, current.id]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...read().filter((p) => p.id !== current.id)].slice(0, MAX + 1)));
    } catch {}
  }, [current]);
  if (items.length < 2) return null;
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
        <ProductRail products={items} />
      </div>
    </section>
  );
}
