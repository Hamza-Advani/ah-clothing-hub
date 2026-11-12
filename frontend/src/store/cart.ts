"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";
import type { CouponPreview } from "@/lib/pricing";

type CartState = {
  items: CartItem[];
  coupon: CouponPreview | null;
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCoupon: (coupon: CouponPreview | null) => void;
};

export const cartKey = (productId: string, size: string, color: string) => `${productId}|${size}|${color}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      add: (item, qty = 1) =>
        set((s) => {
          const key = cartKey(item.productId, item.size, item.color);
          const existing = s.items.find((i) => i.key === key);
          if (existing) {
            return { items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, item.maxStock) } : i)) };
          }
          return { items: [...s.items, { ...item, key, qty: Math.min(qty, item.maxStock) }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.maxStock)) } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    { name: "ah-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((a, i) => a + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((a, i) => a + (i.salePrice ?? i.price) * i.qty, 0);
