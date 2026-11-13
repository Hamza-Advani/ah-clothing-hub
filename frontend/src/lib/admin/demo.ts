/**
 * Fallbacks for the admin panel when Firebase keys are missing (local preview only).
 * Intentionally empty — no fake orders, products or customers.
 */
import { DEFAULT_PAGES, DEFAULT_SETTINGS } from "@/lib/defaults";
import type { Category, ContactMessage, Coupon, Order, OrderPrivate, PagesContent, Product, Review, StoreSettings, UserProfile } from "@/lib/types";

export type AdminMember = { id: string; uid: string; email: string; name: string; role: "admin" | "staff"; permissions: string[]; createdAt: number };
export type CostDoc = { id: string; costPrice: number };
export type PrivateDoc = OrderPrivate & { id: string };

const none = <T,>() => [] as T[];

export const demo = {
  orders: (): Order[] => none(),
  ordersPrivate: (): PrivateDoc[] => none(),
  products: (): Product[] => none(),
  productsPrivate: (): CostDoc[] => none(),
  categories: (): Category[] => none(),
  reviews: (): Review[] => none(),
  settings: (): StoreSettings => DEFAULT_SETTINGS,
  pages: (): PagesContent => DEFAULT_PAGES,
  customers: (): UserProfile[] => none(),
  coupons: (): Coupon[] => none(),
  messages: (): ContactMessage[] => none(),
  admins: (): AdminMember[] => none(),
};
