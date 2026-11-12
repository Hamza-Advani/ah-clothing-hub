import { HttpError } from "../lib/http.js";
import type { Coupon, StoreSettings } from "../lib/types.js";

export function validateCoupon(c: Coupon | undefined, subtotal: number): Coupon {
  if (!c || !c.active) throw new HttpError(400, "This coupon code is invalid or has expired.");
  if (c.expiresAt && c.expiresAt < Date.now()) throw new HttpError(400, "This coupon has expired.");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new HttpError(400, "This coupon has reached its usage limit.");
  if (subtotal < c.minOrder) throw new HttpError(400, `This coupon needs a minimum order of Rs. ${c.minOrder.toLocaleString("en-PK")}.`);
  return c;
}

export function couponDiscount(c: Coupon | null, subtotal: number) {
  if (!c) return 0;
  let d = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount != null) d = Math.min(d, c.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

export function deliveryFor(afterDiscount: number, s: StoreSettings) {
  return afterDiscount >= s.freeDeliveryThreshold ? 0 : s.deliveryCharge;
}

/** Split an order-level discount across lines proportionally (last line absorbs rounding). */
export function allocateDiscount(lineTotals: number[], discount: number) {
  const sum = lineTotals.reduce((a, b) => a + b, 0);
  if (!discount || !sum) return lineTotals.map(() => 0);
  let used = 0;
  return lineTotals.map((t, i) => {
    if (i === lineTotals.length - 1) return discount - used;
    const share = Math.round((t / sum) * discount);
    used += share;
    return share;
  });
}
