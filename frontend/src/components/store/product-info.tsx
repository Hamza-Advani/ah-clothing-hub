"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Heart, Ruler, Share2, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, Modal } from "@/components/ui/radix";
import { Price, Rating } from "@/components/ui/misc";
import { QtyStepper } from "./cart-line";
import { TrustBadges } from "./home-sections";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { useMounted } from "@/hooks/use-mounted";
import { SIZE_GUIDE } from "@/lib/constants";
import { cn, formatPKR } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductInfo({ product, freeDeliveryThreshold, deliveryCharge }: { product: Product; freeDeliveryThreshold: number; deliveryCharge: number }) {
  const router = useRouter();
  const mounted = useMounted();
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  const stockOf = (s: string) => product.variants.find((v) => v.size === s && v.color === color)?.stock ?? 0;
  const stock = size ? stockOf(size) : 0;
  const colorStock = useMemo(() => product.variants.filter((v) => v.color === color).reduce((a, v) => a + v.stock, 0), [product.variants, color]);
  const image = [...product.images].sort((a, b) => a.order - b.order)[0]?.url;

  const addToCart = (buyNow = false) => {
    if (!size) {
      setSizeError(true);
      toast.error("Please select a size");
      return;
    }
    if (stock <= 0) return;
    add({ productId: product.id, slug: product.slug, name: product.name, image, price: product.price, salePrice: product.salePrice, size, color, maxStock: stock }, qty);
    if (buyNow) {
      router.push("/checkout");
    } else {
      setCartOpen(true);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: product.name, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <div className="md:sticky md:top-28">
      <nav aria-label="Breadcrumb" className="mb-4 hidden text-xs text-muted-foreground md:block">
        <Link href="/" className="hover:text-foreground">Home</Link> / <Link href={`/category/${product.categorySlug}`} className="capitalize hover:text-foreground">{product.categorySlug.replace(/-/g, " ")}</Link>
      </nav>
      <div className="flex flex-wrap gap-1.5">
        {product.newArrival && <Badge variant="new">New in</Badge>}
        {product.bestSeller && <Badge variant="bestseller">Bestseller</Badge>}
        {product.salePrice && <Badge variant="sale">Sale</Badge>}
      </div>
      <h1 className="mt-3 text-[34px] font-medium leading-[1.05] md:text-[44px]">{product.name}</h1>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <Rating value={product.rating} showValue />
        <a href="#reviews" className="text-muted-foreground underline-offset-4 hover:underline">{product.reviewCount} reviews</a>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">SKU {product.sku}</span>
      </div>
      <Price price={product.price} salePrice={product.salePrice} size="lg" className="mt-5" />
      <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes. {product.price >= freeDeliveryThreshold || (product.salePrice ?? product.price) >= freeDeliveryThreshold ? "Free delivery." : `Delivery ${formatPKR(deliveryCharge)}, free above ${formatPKR(freeDeliveryThreshold)}.`}</p>

      {/* colour */}
      <div className="mt-8">
        <p className="mb-3 text-sm"><span className="font-semibold">Colour:</span> <span className="text-muted-foreground">{color}</span></p>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Colour">
          {product.colors.map((c) => (
            <button
              key={c.name}
              role="radio"
              aria-checked={c.name === color}
              aria-label={c.name}
              onClick={() => { setColor(c.name); setQty(1); }}
              className={cn("size-10 rounded-full border-[3px] border-background ring-1 transition", c.name === color ? "ring-2 ring-foreground" : "ring-black/15 hover:ring-foreground/50")}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* size */}
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm"><span className="font-semibold">Size:</span> <span className="text-muted-foreground">{size ?? "Select a size"}</span></p>
          <button onClick={() => setGuide(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-4"><Ruler className="size-3.5" /> Size guide</button>
        </div>
        <div className={cn("flex flex-wrap gap-2 rounded-[4px]", sizeError && !size && "animate-[pulse_0.6s_ease_2]")} role="radiogroup" aria-label="Size">
          {product.sizes.map((s) => {
            const st = stockOf(s);
            return (
              <button
                key={s}
                role="radio"
                aria-checked={s === size}
                disabled={st <= 0}
                onClick={() => { setSize(s); setQty(1); setSizeError(false); }}
                className={cn(
                  "relative h-12 min-w-14 rounded-[2px] border px-4 text-sm font-semibold transition",
                  s === size ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-foreground",
                  st <= 0 && "cursor-not-allowed text-muted-foreground/50 [background:linear-gradient(to_top_right,transparent_calc(50%-0.5px),var(--border)_50%,transparent_calc(50%+0.5px))]",
                  sizeError && !size && "border-sale",
                )}
              >
                {s}
                {st > 0 && st <= 3 && <span className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full bg-warning ring-2 ring-background" aria-hidden />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 min-h-5 text-xs font-medium" aria-live="polite">
          {size ? (stock <= 0 ? <span className="text-sale">Out of stock in {color} / {size}</span> : stock <= 3 ? <span className="text-warning">Hurry — only {stock} left in stock</span> : <span className="text-success">In stock · ready to dispatch</span>) : colorStock <= 0 ? <span className="text-sale">This colour is sold out</span> : null}
        </p>
      </div>

      {/* actions */}
      <div className="mt-5 flex gap-3">
        <QtyStepper value={qty} max={Math.max(1, stock)} onChange={setQty} />
        <Button size="lg" className="flex-1" onClick={() => addToCart(false)} disabled={!!size && stock <= 0}>
          <ShoppingBag /> {size && stock <= 0 ? "Sold out" : "Add to bag"}
        </Button>
        <Button
          variant="subtle"
          size="icon"
          className="size-13"
          onClick={() => toast(toggleWish(product.id) ? "Saved to wishlist" : "Removed from wishlist")}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={mounted && wished}
        >
          <Heart className={cn(mounted && wished && "fill-sale text-sale")} />
        </Button>
      </div>
      <Button variant="accent" size="lg" className="mt-3 w-full" onClick={() => addToCart(true)} disabled={!!size && stock <= 0}>
        <Zap /> Buy it now
      </Button>

      <div className="mt-6 rounded-[6px] border border-border bg-surface p-4">
        <TrustBadges freeDeliveryThreshold={freeDeliveryThreshold} compact />
      </div>

      <Accordion type="multiple" defaultValue={["desc"]} className="mt-6">
        <AccordionItem value="desc" title="Description">
          <div className="[&_li]:mb-1 [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: product.description }} />
        </AccordionItem>
        <AccordionItem value="fabric" title="Fabric & care">
          <p><strong className="text-foreground">Material:</strong> {product.material}</p>
          <p className="mt-2"><strong className="text-foreground">Care:</strong> {product.care}</p>
        </AccordionItem>
        <AccordionItem value="ship" title="Delivery & returns">
          <p>Delivered in 2–4 working days to major cities and 4–6 days elsewhere. Cash on Delivery available nationwide.</p>
          <p className="mt-2">Easy 7-day exchange & returns on unworn items with tags. <Link href="/returns" className="text-foreground underline">Read policy</Link></p>
        </AccordionItem>
      </Accordion>
      <button onClick={share} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
        <Share2 className="size-4" /> Share
      </button>

      <Modal open={guide} onOpenChange={setGuide} title="Size guide" description="Body measurements in inches. Between sizes? Choose the larger one for a relaxed fit." className="max-w-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">{SIZE_GUIDE.headers.map((h) => <th key={h} className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody>
              {SIZE_GUIDE.rows.map((r) => (
                <tr key={r[0]} className="border-b border-border/60">{r.map((c, i) => <td key={i} className={cn("py-3 pr-4 tabular-nums", i === 0 && "font-semibold")}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Need help? Message us on WhatsApp — our stylists reply within minutes.</p>
      </Modal>
    </div>
  );
}
