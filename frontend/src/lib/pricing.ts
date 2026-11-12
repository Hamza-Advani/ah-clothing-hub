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

/** Demo coupons used only while the backend is not connected. */
export const DEMO_COUPONS: Record<string, CouponPreview> = {
  WELCOME10: { code: "WELCOME10", type: "percent", value: 10, minOrder: 0, maxDiscount: 2000 },
  AH500: { code: "AH500", type: "fixed", value: 500, minOrder: 4000, maxDiscount: null },
};
