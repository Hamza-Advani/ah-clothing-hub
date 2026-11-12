"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { Price } from "@/components/ui/misc";
import { cn, formatPKR } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

export function QtyStepper({ value, max, onChange, size = "md" }: { value: number; max: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-12";
  return (
    <div className={cn("inline-flex items-center border border-border bg-surface", h)}>
      <button type="button" className={cn("grid place-items-center px-3 disabled:opacity-30", h)} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={cn("grid place-items-center px-3 disabled:opacity-30", h)} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartLine({ item, compact, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const { setQty, remove } = useCart();
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${item.slug}`} onClick={onNavigate} className={cn("relative shrink-0 overflow-hidden rounded-[4px] bg-muted", compact ? "h-28 w-21" : "h-36 w-27 md:h-44 md:w-33")}>
        <Image src={item.image} alt={item.name} fill sizes="130px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${item.slug}`} onClick={onNavigate} className="line-clamp-2 text-[14px] font-semibold leading-snug hover:text-accent">
              {item.name}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.color} · Size {item.size}
            </p>
          </div>
          {!compact && <span className="shrink-0 font-semibold tabular-nums">{formatPKR((item.salePrice ?? item.price) * item.qty)}</span>}
        </div>
        <Price price={item.price} salePrice={item.salePrice} size="sm" className="mt-1.5" />
        <div className="mt-auto flex items-center justify-between pt-3">
          <QtyStepper size="sm" value={item.qty} max={item.maxStock} onChange={(v) => setQty(item.key, v)} />
          <button onClick={() => remove(item.key)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-sale" aria-label={`Remove ${item.name}`}>
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
        {item.qty >= item.maxStock && <p className="mt-2 text-[11px] font-medium text-warning">Only {item.maxStock} left in this size</p>}
      </div>
    </li>
  );
}
