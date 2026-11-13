"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Copy, Eye, EyeOff, MoreHorizontal, Package, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, AInput, ASelect, Card, ConfirmDialog, EmptyBlock, PageHeader, Pager, SearchBox, Table, TableSkeleton, Thumb, usePaged } from "@/components/admin/ui";
import { Checkbox, Modal } from "@/components/ui/radix";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { adminApi, run } from "@/lib/admin/actions";
import { duplicatePayload, toPayload } from "@/lib/admin/product";
import { adminDemoMode } from "@/lib/admin/live";
import { cn, formatPKR } from "@/lib/utils";
import type { Product } from "@/lib/types";

type Sort = "newest" | "name" | "price-asc" | "price-desc" | "stock-asc" | "sold";

function ProductsView() {
  const sp = useSearchParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const canDelete = isAdmin || adminDemoMode;
  const { products, categories, costs } = useAdminData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [vis, setVis] = useState("all");
  const [stock, setStock] = useState(sp.get("stock") ?? "all");
  const [sort, setSort] = useState<Sort>("newest");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[] } | null>(null);
  const [bulkCat, setBulkCat] = useState(false);
  const [bulkStock, setBulkStock] = useState(false);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = (products ?? []).filter(
      (p) =>
        (cat === "all" || p.categoryId === cat) &&
        (vis === "all" || (vis === "active" && p.active) || (vis === "hidden" && !p.active) || (vis === "featured" && p.featured)) &&
        (stock === "all" || (stock === "low" ? p.totalStock <= 5 : stock === "out" ? p.totalStock === 0 : p.totalStock > 5)) &&
        (!s || p.name.toLowerCase().includes(s) || (p.sku ?? "").toLowerCase().includes(s) || (p.tags ?? []).some((t) => t.toLowerCase().includes(s))),
    );
    const eff = (p: Product) => p.salePrice ?? p.price;
    const sorters: Record<Sort, (a: Product, b: Product) => number> = {
      newest: (a, b) => b.createdAt - a.createdAt,
      name: (a, b) => a.name.localeCompare(b.name),
      "price-asc": (a, b) => eff(a) - eff(b),
      "price-desc": (a, b) => eff(b) - eff(a),
      "stock-asc": (a, b) => a.totalStock - b.totalStock,
      sold: (a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0),
    };
    return out.sort(sorters[sort]);
  }, [products, q, cat, vis, stock, sort]);

  const paged = usePaged(list, 20);
  const allOnPage = paged.slice.length > 0 && paged.slice.every((p) => sel.has(p.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...sel];

  const bulk = async (action: "hide" | "show" | "delete", list = ids) => {
    const ok = await run(adminApi.bulkProducts({ ids: list, action }), action === "delete" ? `Deleted ${list.length} product(s)` : `${list.length} product(s) ${action === "hide" ? "hidden" : "visible"}`);
    if (ok) setSel(new Set());
  };

  const duplicate = async (p: Product) => {
    const r = await run(adminApi.createProduct(duplicatePayload(p, costs.get(p.id) ?? 0, new Set((products ?? []).map((x) => x.slug)))), "Product duplicated (hidden until you publish it)");
    if (r?.id) router.push(`/admin/products/${r.id}`);
  };

  const toggleFeatured = (p: Product) => run(adminApi.updateProduct(p.id, { ...toPayload(p, costs.get(p.id) ?? 0), featured: !p.featured }), p.featured ? "Removed from featured" : "Marked as featured");

  return (
    <>
      <PageHeader
        title="Products"
        description={products ? `${products.length} products · ${products.filter((p) => p.active).length} visible in store` : "Loading…"}
        actions={
          <AButton asChild>
            <Link href="/admin/products/new">
              <Plus /> Add product
            </Link>
          </AButton>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_repeat(4,minmax(130px,1fr))]">
          <SearchBox value={q} onChange={(v) => { setQ(v); paged.setPage(1); }} placeholder="Search name, SKU or tag" />
          <ASelect value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </ASelect>
          <ASelect value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Visibility">
            <option value="all">Any visibility</option>
            <option value="active">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="featured">Featured</option>
          </ASelect>
          <ASelect value={stock} onChange={(e) => setStock(e.target.value)} aria-label="Stock">
            <option value="all">Any stock</option>
            <option value="in">In stock (6+)</option>
            <option value="low">Low (≤5)</option>
            <option value="out">Out of stock</option>
          </ASelect>
          <ASelect value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="stock-asc">Stock: low → high</option>
            <option value="sold">Best selling</option>
          </ASelect>
        </div>

        {sel.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/8 px-4 py-2.5 text-sm">
            <b>{sel.size} selected</b>
            <span className="flex-1" />
            <AButton size="sm" variant="subtle" onClick={() => bulk("show")}><Eye /> Show</AButton>
            <AButton size="sm" variant="subtle" onClick={() => bulk("hide")}><EyeOff /> Hide</AButton>
            <AButton size="sm" variant="subtle" onClick={() => setBulkCat(true)}>Change category</AButton>
            <AButton size="sm" variant="subtle" onClick={() => setBulkStock(true)}>Set stock</AButton>
            {canDelete && <AButton size="sm" variant="subtle" className="text-sale" onClick={() => setConfirm({ ids })}><Trash2 /> Delete</AButton>}
            <AButton size="sm" variant="ghost" onClick={() => setSel(new Set())}>Clear</AButton>
          </div>
        )}

        {!products ? (
          <TableSkeleton rows={8} cols={6} />
        ) : list.length === 0 ? (
          <EmptyBlock icon={Package} title={products.length ? "No products match" : "No products yet"} description={products.length ? "Try a different search or filter." : "Add your first product with photos, sizes and stock."} action={!products.length ? <AButton asChild><Link href="/admin/products/new"><Plus /> Add product</Link></AButton> : undefined} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th className="w-10">
                    <Checkbox checked={allOnPage} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); paged.slice.forEach((p) => (v ? n.add(p.id) : n.delete(p.id))); return n; })} aria-label="Select all on page" />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Sold</th>
                  <th>Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((p) => {
                  const cost = costs.get(p.id) ?? 0;
                  const eff = p.salePrice ?? p.price;
                  return (
                    <tr key={p.id} className={cn("transition hover:bg-muted/50", sel.has(p.id) && "bg-accent/5")}>
                      <td><Checkbox checked={sel.has(p.id)} onCheckedChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} /></td>
                      <td>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <Thumb src={p.images[0]?.url} alt={p.name} />
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate font-semibold hover:text-accent">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.sku || "No SKU"} · {p.images.length} photo{p.images.length === 1 ? "" : "s"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-muted-foreground">{catName.get(p.categoryId) ?? p.categorySlug}</td>
                      <td className="text-right tabular-nums">
                        {p.salePrice != null ? (
                          <>
                            <span className="font-semibold text-sale">{formatPKR(p.salePrice)}</span>
                            <span className="block text-xs text-muted-foreground line-through">{formatPKR(p.price)}</span>
                          </>
                        ) : (
                          <span className="font-semibold">{formatPKR(p.price)}</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums text-muted-foreground">
                        {cost ? formatPKR(cost) : "—"}
                        {cost > 0 && <span className="block text-[11px] text-success">{Math.round(((eff - cost) / eff) * 100)}% margin</span>}
                      </td>
                      <td className="text-right">
                        <span className={cn("font-semibold tabular-nums", p.totalStock === 0 ? "text-sale" : p.totalStock <= 5 ? "text-warning" : "")}>{p.totalStock}</span>
                      </td>
                      <td className="text-right tabular-nums text-muted-foreground">{p.soldCount ?? 0}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {p.active ? <Badge variant="success" shape="pill">Visible</Badge> : <Badge variant="neutral" shape="pill">Hidden</Badge>}
                          {p.featured && <Badge variant="bestseller" shape="pill">Featured</Badge>}
                          {p.newArrival && <Badge variant="info" shape="pill">New</Badge>}
                        </div>
                      </td>
                      <td>
                        <DM.Root>
                          <DM.Trigger className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Actions"><MoreHorizontal className="size-4" /></DM.Trigger>
                          <DM.Portal>
                            <DM.Content align="end" className="z-[70] w-48 rounded-xl border border-border bg-surface p-1.5 text-sm shadow-lift">
                              <MenuItem onSelect={() => router.push(`/admin/products/${p.id}`)} icon={Pencil}>Edit</MenuItem>
                              <MenuItem onSelect={() => duplicate(p)} icon={Copy}>Duplicate</MenuItem>
                              <MenuItem onSelect={() => bulk(p.active ? "hide" : "show", [p.id])} icon={p.active ? EyeOff : Eye}>{p.active ? "Hide from store" : "Show in store"}</MenuItem>
                              <MenuItem onSelect={() => toggleFeatured(p)} icon={Star}>{p.featured ? "Unfeature" : "Feature on homepage"}</MenuItem>
                              <MenuItem onSelect={() => window.open(`/product/${p.slug}`, "_blank")} icon={Eye}>View in store</MenuItem>
                              {canDelete && <MenuItem onSelect={() => setConfirm({ ids: [p.id] })} icon={Trash2} danger>Delete</MenuItem>}
                            </DM.Content>
                          </DM.Portal>
                        </DM.Root>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pager {...paged} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`Delete ${confirm?.ids.length === 1 ? "this product" : `${confirm?.ids.length} products`}?`}
        description="This permanently removes the product(s) and their photos. Existing orders keep their details."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!confirm) return;
          if (confirm.ids.length === 1) {
            const ok = await run(adminApi.deleteProduct(confirm.ids[0]), "Product deleted");
            if (ok) setSel((s) => { const n = new Set(s); n.delete(confirm.ids[0]); return n; });
          } else await bulk("delete", confirm.ids);
        }}
      />
      <BulkCategory open={bulkCat} onOpenChange={setBulkCat} ids={ids} onDone={() => setSel(new Set())} />
      <BulkStock open={bulkStock} onOpenChange={setBulkStock} ids={ids} onDone={() => setSel(new Set())} />
    </>
  );
}

function MenuItem({ children, icon: Icon, onSelect, danger }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }>; onSelect: () => void; danger?: boolean }) {
  return (
    <DM.Item onSelect={onSelect} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-muted", danger && "text-sale data-[highlighted]:bg-sale/10")}>
      <Icon className="size-4 opacity-70" /> {children}
    </DM.Item>
  );
}

function BulkCategory({ open, onOpenChange, ids, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; ids: string[]; onDone: () => void }) {
  const { categories } = useAdminData();
  const [cid, setCid] = useState("");
  const [busy, setBusy] = useState(false);
  const c = (categories ?? []).find((x) => x.id === cid) ?? categories?.[0];
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Change category" description={`Move ${ids.length} product(s) to:`} className="max-w-md">
      <ASelect value={c?.id ?? ""} onChange={(e) => setCid(e.target.value)}>
        {(categories ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </ASelect>
      <div className="mt-5 flex justify-end">
        <AButton loading={busy} disabled={!c} onClick={async () => { setBusy(true); const ok = await run(adminApi.bulkProducts({ ids, action: "category", categoryId: c!.id, categorySlug: c!.slug }), "Category updated"); setBusy(false); if (ok) { onDone(); onOpenChange(false); } }}>Move products</AButton>
      </div>
    </Modal>
  );
}

function BulkStock({ open, onOpenChange, ids, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; ids: string[]; onDone: () => void }) {
  const [n, setN] = useState("10");
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Set stock" description={`Sets every size/colour of ${ids.length} product(s) to this quantity.`} className="max-w-md">
      <AInput type="number" min={0} value={n} onChange={(e) => setN(e.target.value)} />
      <div className="mt-5 flex justify-end">
        <AButton loading={busy} onClick={async () => { setBusy(true); const ok = await run(adminApi.bulkProducts({ ids, action: "stock", stock: Math.max(0, Math.floor(Number(n) || 0)) }), "Stock updated"); setBusy(false); if (ok) { onDone(); onOpenChange(false); } }}>Update stock</AButton>
      </div>
    </Modal>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
