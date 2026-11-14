"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "./product-card";
import { Button } from "@/components/ui/button";
import { Checkbox, Sheet, SheetContent } from "@/components/ui/radix";
import { EmptyState } from "@/components/ui/misc";
import { filterProducts, type ProductQuery } from "@/lib/catalog";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn, formatPKR } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

const PAGE = 12;
const PRICE_BANDS: [string, number | undefined, number | undefined][] = [
  ["Under Rs. 3,000", undefined, 3000],
  ["Rs. 3,000 – 7,000", 3000, 7000],
  ["Rs. 7,000 – 15,000", 7000, 15000],
  ["Above Rs. 15,000", 15000, undefined],
];

type ShopViewProps = { products: Product[]; categories: Category[]; fixedCategory?: string };
type Params = Pick<URLSearchParams, "get" | "toString">;
const NO_PARAMS: Params = new URLSearchParams();

/** Interactive shop grid driven by URL params (?size=, ?sort=, ?q= …). */
export function ShopView(props: ShopViewProps) {
  return <ShopViewInner {...props} sp={useSearchParams()} />;
}

/**
 * Suspense fallback = the same view with no filters applied. It renders on the server, so the HTML
 * that search engines receive already contains the real product grid and product links (not a skeleton),
 * and it matches the default client view exactly (no layout shift on hydration).
 */
export function ShopFallback(props: ShopViewProps) {
  return <ShopViewInner {...props} sp={NO_PARAMS} />;
}

function ShopViewInner({ products, categories, fixedCategory, sp }: ShopViewProps & { sp: Params }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = (k: string) => sp.get(k)?.split(",").filter(Boolean) ?? [];
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  const query: ProductQuery = {
    category: fixedCategory ?? sp.get("category") ?? undefined,
    sizes: list("size"),
    colors: list("color"),
    minPrice: num("min"),
    maxPrice: num("max"),
    inStock: sp.get("stock") === "1",
    onSale: sp.get("sale") === "1",
    filter: (sp.get("filter") as ProductQuery["filter"]) ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as ProductQuery["sort"]) ?? "newest",
  };
  const page = Number(sp.get("page") ?? 1);

  const base = useMemo(() => (fixedCategory ? products.filter((p) => p.categorySlug === fixedCategory) : products), [products, fixedCategory]);
  const allSizes = useMemo(() => [...new Set(base.flatMap((p) => p.sizes))], [base]);
  const allColors = useMemo(() => {
    const m = new Map<string, string>();
    base.forEach((p) => p.colors.forEach((c) => m.set(c.name, c.hex)));
    return [...m.entries()];
  }, [base]);

  const results = useMemo(() => filterProducts(products, query), [products, sp, fixedCategory]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = results.slice(0, page * PAGE);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const toggleIn = (k: string, v: string) => {
    const cur = list(k);
    update({ [k]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(",") || null });
  };

  const chips: { label: string; clear: () => void }[] = [
    ...(query.q ? [{ label: `“${query.q}”`, clear: () => update({ q: null }) }] : []),
    ...(query.filter ? [{ label: { new: "New arrivals", bestsellers: "Best sellers", featured: "Featured", sale: "Sale" }[query.filter], clear: () => update({ filter: null }) }] : []),
    ...(!fixedCategory && query.category ? [{ label: categories.find((c) => c.slug === query.category)?.name ?? query.category, clear: () => update({ category: null }) }] : []),
    ...query.sizes!.map((s) => ({ label: `Size ${s}`, clear: () => toggleIn("size", s) })),
    ...query.colors!.map((c) => ({ label: c, clear: () => toggleIn("color", c) })),
    ...(query.minPrice != null || query.maxPrice != null ? [{ label: `${query.minPrice ? formatPKR(query.minPrice) : "Rs. 0"} – ${query.maxPrice ? formatPKR(query.maxPrice) : "∞"}`, clear: () => update({ min: null, max: null }) }] : []),
    ...(query.inStock ? [{ label: "In stock", clear: () => update({ stock: null }) }] : []),
    ...(query.onSale ? [{ label: "On sale", clear: () => update({ sale: null }) }] : []),
  ];
  const clearAll = () => startTransition(() => router.replace(pathname, { scroll: false }));

  const Filters = (
    <div className="space-y-8">
      {!fixedCategory && (
        <FilterGroup title="Category">
          <div className="space-y-2.5">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox checked={query.category === c.slug} onCheckedChange={() => update({ category: query.category === c.slug ? null : c.slug })} />
                {c.name}
                <span className="ml-auto text-xs text-muted-foreground">{products.filter((p) => p.categorySlug === c.slug).length}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button key={s} onClick={() => toggleIn("size", s)} aria-pressed={query.sizes!.includes(s)} className={cn("h-10 min-w-11 rounded-[2px] border px-3 text-sm font-medium transition", query.sizes!.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-foreground")}>
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Colour">
        <div className="grid grid-cols-2 gap-2.5">
          {allColors.map(([name, hex]) => (
            <button key={name} onClick={() => toggleIn("color", name)} aria-pressed={query.colors!.includes(name)} className="flex items-center gap-2.5 text-left text-sm">
              <span className={cn("size-6 shrink-0 rounded-full border-2 ring-1 ring-black/10 transition", query.colors!.includes(name) ? "border-background ring-2 ring-foreground" : "border-background")} style={{ background: hex }} />
              {name}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="space-y-2.5">
          {PRICE_BANDS.map(([label, min, max]) => {
            const active = query.minPrice === min && query.maxPrice === max;
            return (
              <label key={label} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox checked={active} onCheckedChange={() => update(active ? { min: null, max: null } : { min: min ? String(min) : null, max: max ? String(max) : null })} />
                {label}
              </label>
            );
          })}
        </div>
        <PriceInputs min={query.minPrice} max={query.maxPrice} onApply={(mn, mx) => update({ min: mn ? String(mn) : null, max: mx ? String(mx) : null })} />
      </FilterGroup>
      <FilterGroup title="Availability">
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={query.inStock} onCheckedChange={() => update({ stock: query.inStock ? null : "1" })} />In stock only</label>
          <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={query.onSale} onCheckedChange={() => update({ sale: query.onSale ? null : "1" })} />On sale</label>
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="container-x py-8 md:py-12">
      {/* toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <button onClick={() => setFiltersOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold lg:hidden">
          <SlidersHorizontal className="size-4" /> Filters {chips.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{chips.length}</span>}
        </button>
        <p className="hidden text-sm text-muted-foreground lg:block"><span className="font-semibold text-foreground">{results.length}</span> products</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">Sort by</span>
          <select value={query.sort} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="h-10 rounded-full border border-border bg-surface px-4 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">{Filters}</div>
        </aside>
        <div>
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold transition hover:bg-border">
                  {c.label} <X className="size-3" />
                </button>
              ))}
              <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">Clear all</button>
            </div>
          )}
          {results.length === 0 ? (
            <EmptyState icon={SearchX} title="No matches found" description="Try removing a filter or searching for something else." action={<Button variant="outline" onClick={clearAll}>Clear filters</Button>} />
          ) : (
            <>
              <ProductGrid products={visible} className="lg:grid-cols-3 xl:grid-cols-4" />
              <div className="mt-14 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">Showing {visible.length} of {results.length}</p>
                <div className="h-[2px] w-48 overflow-hidden bg-border"><div className="h-full bg-foreground transition-all" style={{ width: `${(visible.length / results.length) * 100}%` }} /></div>
                {visible.length < results.length && (
                  <Button variant="outline" size="lg" onClick={() => update({ page: String(page + 1) })}>Load more</Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" title="Filters">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-display text-2xl">Filters</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{Filters}</div>
          <div className="grid grid-cols-2 gap-3 border-t border-border p-4">
            <Button variant="outline" onClick={clearAll}>Clear</Button>
            <Button onClick={() => setFiltersOpen(false)}>Show {results.length}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4 text-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function PriceInputs({ min, max, onApply }: { min?: number; max?: number; onApply: (min?: number, max?: number) => void }) {
  const [a, setA] = useState(min?.toString() ?? "");
  const [b, setB] = useState(max?.toString() ?? "");
  return (
    <form className="mt-4 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); onApply(a ? Number(a) : undefined, b ? Number(b) : undefined); }}>
      <input value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Min" aria-label="Minimum price" className="h-10 w-full rounded-[2px] border border-border bg-surface px-3 text-sm" />
      <span className="text-muted-foreground">–</span>
      <input value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Max" aria-label="Maximum price" className="h-10 w-full rounded-[2px] border border-border bg-surface px-3 text-sm" />
      <button type="submit" className="h-10 shrink-0 rounded-[2px] bg-primary px-3 text-xs font-bold uppercase text-primary-foreground">Go</button>
    </form>
  );
}

export function ShopSkeleton() {
  return (
    <div className="container-x grid grid-cols-2 gap-x-3 gap-y-10 py-12 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/4] rounded-[6px]" />
          <div className="skeleton mt-4 h-3 w-1/3" />
          <div className="skeleton mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
