"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Eye, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AButton, AField, AInput, ASelect, ATextarea, Card, ConfirmDialog, PageHeader } from "./ui";
import { ImageUploader, type Img } from "./image-uploader";
import { RichText } from "./rich-text";
import { useAdminData } from "./admin-data";
import { Switch } from "@/components/ui/radix";
import { adminApi, run } from "@/lib/admin/actions";
import { toPayload, type ProductPayload } from "@/lib/admin/product";
import { SIZES } from "@/lib/constants";
import { cn, formatPKR, slugify } from "@/lib/utils";
import type { Product } from "@/lib/types";

const PRESET_COLORS = [
  { name: "Black", hex: "#141414" }, { name: "White", hex: "#ffffff" }, { name: "Ivory", hex: "#f4efe4" }, { name: "Beige", hex: "#d9c3a0" },
  { name: "Navy", hex: "#1f2a44" }, { name: "Maroon", hex: "#6b1e2b" }, { name: "Emerald", hex: "#1f5d4c" }, { name: "Olive", hex: "#6b6b3a" },
  { name: "Mustard", hex: "#c99a2e" }, { name: "Blush", hex: "#e8b4b8" }, { name: "Sky", hex: "#9cc3e4" }, { name: "Grey", hex: "#8a8a8a" },
];

const schema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(140),
    slug: z.string().regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and dashes").max(160),
    categoryId: z.string().min(1, "Choose a category"),
    price: z.number().int().min(1, "Enter a price"),
    salePrice: z.number().int().min(0).nullable(),
    costPrice: z.number().int().min(0),
    sizes: z.array(z.string()).min(1, "Add at least one size"),
    colors: z.array(z.object({ name: z.string().min(1), hex: z.string() })).min(1, "Add at least one colour"),
    images: z.array(z.any()).max(8),
  })
  .refine((p) => p.salePrice == null || p.salePrice < p.price, { path: ["salePrice"], message: "Sale price must be lower than the regular price" });

const empty = (): ProductPayload => ({
  name: "", slug: "", description: "", categoryId: "", categorySlug: "", tags: [], price: 0, salePrice: null, costPrice: 0, sku: "",
  sizes: ["S", "M", "L"], colors: [{ name: "Black", hex: "#141414" }], variants: [], images: [], material: "", care: "", active: true, featured: false, newArrival: true, bestSeller: false,
});

const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v) || 0)));

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { categories, costs, products } = useAdminData();
  const [f, setF] = useState<ProductPayload>(() => (product ? toPayload(product, costs.get(product.id) ?? 0) : empty()));
  const [images, setImages] = useState<Img[]>(() => (product?.images ?? []).map((i) => ({ url: i.url, publicId: i.publicId ?? "", alt: i.alt })));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [tagInput, setTagInput] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [newColor, setNewColor] = useState({ name: "", hex: "#b08d57" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(false);
  const [bulkQty, setBulkQty] = useState("10");

  const set = <K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) => setF((p) => ({ ...p, [k]: v }));
  const stockOf = (size: string, color: string) => f.variants.find((v) => v.size === size && v.color === color)?.stock ?? 0;
  const setStock = (size: string, color: string, stock: number) =>
    setF((p) => {
      const rest = p.variants.filter((v) => !(v.size === size && v.color === color));
      return { ...p, variants: [...rest, { size, color, stock }] };
    });
  const totalStock = f.sizes.reduce((a, s) => a + f.colors.reduce((b, c) => b + stockOf(s, c.name), 0), 0);

  const eff = f.salePrice ?? f.price;
  const margin = eff > 0 && f.costPrice > 0 ? Math.round(((eff - f.costPrice) / eff) * 100) : null;

  const submit = async () => {
    const cat = (categories ?? []).find((c) => c.id === f.categoryId);
    const candidate = { ...f, images };
    const r = schema.safeParse(candidate);
    if (!r.success) {
      const e: Record<string, string> = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if ((products ?? []).some((p) => p.slug === f.slug && p.id !== product?.id)) {
      setErrors({ slug: "Another product already uses this URL" });
      return;
    }
    setErrors({});
    // only keep variants for current sizes × colours
    const variants = f.sizes.flatMap((s) => f.colors.map((c) => ({ size: s, color: c.name, stock: stockOf(s, c.name) })));
    const body: ProductPayload = {
      ...f,
      categorySlug: cat?.slug ?? f.categorySlug,
      variants,
      images: images.map((i, k) => ({ url: i.url, publicId: i.publicId, order: k, ...(i.alt ? { alt: i.alt } : {}) })),
      material: f.material || undefined,
      care: f.care || undefined,
    };
    setSaving(true);
    const res = await run(product ? adminApi.updateProduct(product.id, body) : adminApi.createProduct(body), product ? "Product saved" : "Product created");
    setSaving(false);
    if (res && !product) router.replace(`/admin/products/${res.id}`);
  };

  const err = (k: string) => errors[k];

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Products
          </Link>
        }
        title={product ? f.name || "Edit product" : "Add product"}
        description={product ? `Last updated ${product.updatedAt ? new Date(product.updatedAt).toLocaleString("en-PK") : "—"}` : "Fill in the details, add photos and stock, then save."}
        actions={
          <>
            {product && (
              <AButton variant="subtle" asChild>
                <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer"><Eye /> View</a>
              </AButton>
            )}
            {product && <AButton variant="subtle" className="text-sale" onClick={() => setDel(true)}><Trash2 /> Delete</AButton>}
            <AButton onClick={submit} loading={saving}><Save /> {product ? "Save changes" : "Create product"}</AButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <h3 className="text-[15px] font-semibold">Basic information</h3>
            <AField label="Product name" htmlFor="p-name" error={err("name")}>
              <AInput id="p-name" value={f.name} invalid={!!err("name")} placeholder="e.g. Embroidered Lawn 3-Piece" onChange={(e) => { const name = e.target.value; setF((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) })); }} />
            </AField>
            <AField label="URL slug" htmlFor="p-slug" error={err("slug")} hint={`ahclothinghub.pk/product/${f.slug || "…"}`}>
              <AInput id="p-slug" value={f.slug} invalid={!!err("slug")} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            </AField>
            <AField label="Description">
              <RichText value={f.description} onChange={(v) => set("description", v)} placeholder="Fabric, fit, embellishments, what's included…" />
            </AField>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[15px] font-semibold">Photos</h3>
              <span className="text-xs text-muted-foreground">Up to 8 · JPG/PNG/WebP · auto-compressed</span>
            </div>
            <ImageUploader value={images} onChange={setImages} />
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="text-[15px] font-semibold">Pricing</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <AField label="Price (Rs.)" htmlFor="p-price" error={err("price")}>
                <AInput id="p-price" inputMode="numeric" value={f.price || ""} invalid={!!err("price")} onChange={(e) => set("price", num(e.target.value))} placeholder="4990" />
              </AField>
              <AField label="Sale price (Rs.)" htmlFor="p-sale" error={err("salePrice")} hint="Leave empty if not on sale">
                <AInput id="p-sale" inputMode="numeric" value={f.salePrice ?? ""} invalid={!!err("salePrice")} onChange={(e) => set("salePrice", e.target.value === "" ? null : num(e.target.value))} />
              </AField>
              <AField label="Cost price (Rs.)" htmlFor="p-cost" hint="Private — only admins see this">
                <AInput id="p-cost" inputMode="numeric" value={f.costPrice || ""} onChange={(e) => set("costPrice", num(e.target.value))} placeholder="2700" />
              </AField>
            </div>
            {f.price > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-muted/60 px-4 py-3 text-sm">
                <span>Customer pays <b className="tabular-nums">{formatPKR(eff)}</b></span>
                {f.salePrice != null && f.salePrice < f.price && <span className="text-sale">{Math.round(((f.price - f.salePrice) / f.price) * 100)}% off</span>}
                {margin !== null && <span>Profit per piece <b className={cn("tabular-nums", margin < 0 ? "text-sale" : "text-success")}>{formatPKR(eff - f.costPrice)} ({margin}%)</b></span>}
              </div>
            )}
          </Card>

          <Card className="space-y-5 p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[15px] font-semibold">Sizes, colours & stock</h3>
              <span className="text-sm">Total stock: <b className="tabular-nums">{totalStock}</b></span>
            </div>
            <AField label="Sizes" error={err("sizes")}>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...SIZES, "Free Size", ...f.sizes])].map((s) => {
                  const on = f.sizes.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => set("sizes", on ? f.sizes.filter((x) => x !== s) : [...f.sizes, s].sort((a, b) => order(a) - order(b)))} className={cn("h-9 min-w-11 rounded-lg border px-3 text-[13px] font-semibold transition", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40")}>
                      {s}
                    </button>
                  );
                })}
                <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); const s = customSize.trim(); if (s && !f.sizes.includes(s)) set("sizes", [...f.sizes, s]); setCustomSize(""); }}>
                  <AInput value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="Custom (e.g. 32)" className="h-9 w-32" />
                  <AButton type="submit" size="icon-sm" variant="subtle" aria-label="Add size" className="size-9"><Plus /></AButton>
                </form>
              </div>
            </AField>

            <AField label="Colours" error={err("colors")}>
              <div className="flex flex-wrap gap-1.5">
                {f.colors.map((c) => (
                  <span key={c.name} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border pl-2 pr-1 text-[13px] font-medium">
                    <span className="size-4 rounded-full border border-black/10" style={{ background: c.hex }} /> {c.name}
                    <button type="button" onClick={() => set("colors", f.colors.filter((x) => x.name !== c.name))} className="grid size-6 place-items-center rounded-md hover:bg-muted" aria-label={`Remove ${c.name}`}><X className="size-3.5" /></button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {PRESET_COLORS.filter((p) => !f.colors.some((c) => c.name === p.name)).map((p) => (
                  <button key={p.name} type="button" title={p.name} onClick={() => set("colors", [...f.colors, p])} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2 text-[11.5px] hover:border-foreground/40">
                    <span className="size-3 rounded-full border border-black/10" style={{ background: p.hex }} /> {p.name}
                  </button>
                ))}
              </div>
              <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const n = newColor.name.trim(); if (n && !f.colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) set("colors", [...f.colors, { name: n, hex: newColor.hex }]); setNewColor({ ...newColor, name: "" }); }}>
                <input type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-surface p-1" aria-label="Colour" />
                <AInput value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} placeholder="Custom colour name" className="h-9 max-w-52" />
                <AButton type="submit" size="sm" variant="subtle" className="h-9"><Plus /> Add</AButton>
              </form>
            </AField>

            {f.sizes.length > 0 && f.colors.length > 0 && (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold">Stock per size & colour</p>
                  <div className="flex items-center gap-1.5 text-xs">
                    Set all to
                    <AInput value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} inputMode="numeric" className="h-8 w-16" />
                    <AButton type="button" size="sm" variant="subtle" onClick={() => setF((p) => ({ ...p, variants: p.sizes.flatMap((s) => p.colors.map((c) => ({ size: s, color: c.name, stock: num(bulkQty) }))) }))}>Apply</AButton>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Colour \ Size</th>
                        {f.sizes.map((s) => <th key={s} className="px-2 py-2 text-center text-xs font-semibold">{s}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {f.colors.map((c) => (
                        <tr key={c.name} className="border-t border-border">
                          <td className="whitespace-nowrap px-3 py-2 font-medium"><span className="mr-2 inline-block size-3 rounded-full border border-black/10 align-middle" style={{ background: c.hex }} />{c.name}</td>
                          {f.sizes.map((s) => {
                            const v = stockOf(s, c.name);
                            return (
                              <td key={s} className="px-1.5 py-1.5">
                                <input aria-label={`Stock ${c.name} ${s}`} inputMode="numeric" value={v} onChange={(e) => setStock(s, c.name, num(e.target.value))} onFocus={(e) => e.target.select()} className={cn("h-9 w-full min-w-14 rounded-md border border-border bg-surface text-center tabular-nums focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25", v === 0 && "text-sale")} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <h3 className="text-[15px] font-semibold sm:col-span-2">Details</h3>
            <AField label="Material / fabric" htmlFor="p-mat"><AInput id="p-mat" value={f.material ?? ""} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Premium lawn, chiffon dupatta" /></AField>
            <AField label="Weight (kg)" htmlFor="p-w" hint="For courier charges"><AInput id="p-w" inputMode="decimal" value={f.weight ?? ""} onChange={(e) => set("weight", e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0))} placeholder="0.6" /></AField>
            <AField label="Care instructions" htmlFor="p-care" className="sm:col-span-2"><ATextarea id="p-care" value={f.care ?? ""} onChange={(e) => set("care", e.target.value)} className="min-h-16" placeholder="Hand wash cold, do not bleach, iron on low heat" /></AField>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-5 xl:sticky xl:top-20">
            <h3 className="text-[15px] font-semibold">Visibility</h3>
            {(
              [
                ["active", "Visible in store", "Hidden products can't be bought"],
                ["featured", "Featured", "Shown in homepage featured section"],
                ["newArrival", "New arrival", "Shown in New Arrivals"],
                ["bestSeller", "Best seller", "Shown in Best Sellers"],
              ] as const
            ).map(([k, t, d]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="block text-[13.5px] font-medium">{t}</span>
                  <span className="text-xs text-muted-foreground">{d}</span>
                </span>
                <Switch checked={f[k]} onCheckedChange={(v) => set(k, v)} />
              </label>
            ))}
            <hr className="border-border" />
            <AField label="Category" error={err("categoryId")}>
              <ASelect value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Choose…</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </ASelect>
              {categories && categories.length === 0 && <Link href="/admin/categories" className="mt-1 inline-block text-xs font-semibold text-accent">Create a category first →</Link>}
            </AField>
            <AField label="SKU" htmlFor="p-sku" hint="Your internal stock code"><AInput id="p-sku" value={f.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="AH-LWN-001" /></AField>
            <AField label="Tags" hint="Press Enter to add · used in search">
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface p-1.5 focus-within:border-accent">
                {f.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {t}
                    <button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="size-3" /></button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      const t = tagInput.trim().toLowerCase();
                      if (!f.tags.includes(t)) set("tags", [...f.tags, t]);
                      setTagInput("");
                    } else if (e.key === "Backspace" && !tagInput && f.tags.length) set("tags", f.tags.slice(0, -1));
                  }}
                  placeholder={f.tags.length ? "" : "lawn, eid, embroidered"}
                  className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
                />
              </div>
            </AField>
            <AButton className="w-full" onClick={submit} loading={saving}><Save /> {product ? "Save changes" : "Create product"}</AButton>
          </Card>
        </div>
      </div>

      {product && (
        <ConfirmDialog
          open={del}
          onOpenChange={setDel}
          title="Delete this product?"
          description="The product and its photos will be permanently removed."
          confirmLabel="Delete product"
          destructive
          onConfirm={async () => {
            const ok = await run(adminApi.deleteProduct(product.id), "Product deleted");
            if (ok) router.replace("/admin/products");
          }}
        />
      )}
    </>
  );
}

function order(s: string) {
  const i = SIZES.indexOf(s);
  return i === -1 ? 100 + (Number(s) || 0) : i;
}
