"use client";
import { useState } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";
import { api, isApiConfigured } from "@/lib/api";
import { DEMO_COUPONS, type CouponPreview } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";

export function CouponInput({ subtotal, coupon, onApply }: { subtotal: number; coupon: CouponPreview | null; onApply: (c: CouponPreview | null) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    try {
      let result: CouponPreview | null;
      if (isApiConfigured) {
        result = (await api.post<{ coupon: CouponPreview }>("/api/coupons/validate", { code: c, subtotal })).coupon;
      } else {
        result = DEMO_COUPONS[c] ?? null;
        if (!result) throw new Error("This coupon code is invalid or has expired.");
      }
      if (subtotal < result.minOrder) throw new Error(`Add ${formatPKR(result.minOrder - subtotal)} more to use this coupon.`);
      onApply(result);
      setCode("");
      toast.success(`Coupon ${c} applied`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setLoading(false);
    }
  };
  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-[4px] border border-dashed border-success/60 bg-success/5 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-success"><Tag className="size-4" /> {coupon.code} applied</span>
        <button type="button" onClick={() => onApply(null)} className="text-muted-foreground hover:text-foreground" aria-label="Remove coupon"><X className="size-4" /></button>
      </div>
    );
  }
  return (
    <form onSubmit={apply} className="flex gap-2">
      <label htmlFor="coupon" className="sr-only">Coupon code</label>
      <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="h-11 flex-1 rounded-[2px] border border-border bg-surface px-4 text-sm uppercase placeholder:normal-case focus:border-accent focus:outline-none" />
      <button type="submit" disabled={loading || !code} className="h-11 rounded-[2px] border border-foreground px-5 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-foreground hover:text-background disabled:opacity-40">
        {loading ? "…" : "Apply"}
      </button>
    </form>
  );
}

export function TotalsRows({ subtotal, discount, delivery, total, freeDeliveryThreshold }: { subtotal: number; discount: number; delivery: number; total: number; freeDeliveryThreshold: number }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPKR(subtotal)}</dd></div>
      {discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular-nums">− {formatPKR(discount)}</dd></div>}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Delivery</dt>
        <dd className="tabular-nums">{delivery === 0 ? <span className="font-semibold text-success">Free</span> : formatPKR(delivery)}</dd>
      </div>
      {delivery > 0 && <p className="text-xs text-muted-foreground">Free delivery on orders above {formatPKR(freeDeliveryThreshold)}</p>}
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <dt className="font-semibold">Total</dt>
        <dd className="text-xl font-semibold tabular-nums">{formatPKR(total)}</dd>
      </div>
    </dl>
  );
}
