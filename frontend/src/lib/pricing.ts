/**
 * Client-side PREVIEW of order totals. The backend recalculates everything
 * from Firestore prices before an order is saved — never trust these numbers.
 */
export type CouponPreview = { code: string; type: "percent" | "fixed"; value: number; minOrder: number; maxDiscount: number | null };

export function previewTotals(subtotal: number, opts: { deliveryCharge: number; freeDeliveryThreshold: number; coupon?: CouponPreview | null }) {
  let discount = 0;
  const c = opts.coupon;
  if (c && subtotal >= c.minOrder) {
    discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
    if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
    discount = Math.min(discount, subtotal);
  }
  const afterDiscount = subtotal - discount;
  const delivery = subtotal === 0 || afterDiscount >= opts.freeDeliveryThreshold ? 0 : opts.deliveryCharge;
  return { subtotal, discount, delivery, total: afterDiscount + delivery };
}

