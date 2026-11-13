/** Demo data for the admin panel preview (used only when Firebase keys are missing). */
import { DUMMY_CATEGORIES, DUMMY_COST_RATIO, DUMMY_PAGES, DUMMY_PRODUCTS, DUMMY_REVIEWS, DUMMY_SETTINGS } from "@/lib/dummy-data";
import { generateDemoOrders, type DemoOrder } from "@/lib/demo-orders";
import type { Category, ContactMessage, Coupon, Order, OrderPrivate, PagesContent, Product, Review, StoreSettings, UserProfile } from "@/lib/types";

export type AdminMember = { id: string; uid: string; email: string; name: string; role: "admin" | "staff"; permissions: string[]; createdAt: number };
export type CostDoc = { id: string; costPrice: number };
export type PrivateDoc = OrderPrivate & { id: string };

let cache: DemoOrder[] | null = null;
const demoOrdersAll = () => (cache ??= generateDemoOrders(220, 120));

export const demo = {
  orders: (): Order[] => demoOrdersAll().map(({ private: _p, ...o }) => { void _p; return o; }),
  ordersPrivate: (): PrivateDoc[] => demoOrdersAll().map((o) => ({ id: o.id, ...o.private })),
  products: (): Product[] => DUMMY_PRODUCTS.map((p, i) => (i === 3 ? { ...p, totalStock: 3 } : i === 7 ? { ...p, totalStock: 0 } : p)),
  productsPrivate: (): CostDoc[] => DUMMY_PRODUCTS.map((p) => ({ id: p.id, costPrice: Math.round(p.price * DUMMY_COST_RATIO) })),
  categories: (): Category[] => DUMMY_CATEGORIES,
  reviews: (): Review[] => DUMMY_REVIEWS.map((r, i) => (i % 9 === 0 ? { ...r, status: "pending" as const } : r)),
  settings: (): StoreSettings => DUMMY_SETTINGS,
  pages: (): PagesContent => DUMMY_PAGES,
  customers: (): UserProfile[] => {
    const map = new Map<string, UserProfile>();
    for (const o of demoOrdersAll()) {
      if (!o.userId) continue;
      const c = map.get(o.userId) ?? {
        uid: o.userId,
        name: o.customer.name,
        email: o.customer.email,
        phone: o.customer.phone,
        photoURL: null,
        role: "customer" as const,
        blocked: false,
        addresses: [{ id: "a1", label: "Home", name: o.customer.name, phone: o.customer.phone, address: o.shipping.address, city: o.shipping.city, isDefault: true }],
        wishlist: [],
        ordersCount: 0,
        totalSpent: 0,
        createdAt: o.createdAt,
      };
      c.ordersCount++;
      if (o.status !== "cancelled" && o.status !== "returned") c.totalSpent += o.total;
      c.createdAt = Math.min(c.createdAt, o.createdAt - 86_400_000);
      map.set(o.userId, c);
    }
    return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
  },
  coupons: (): Coupon[] => [
    { code: "WELCOME10", type: "percent", value: 10, minOrder: 0, maxDiscount: 2000, expiresAt: null, usageLimit: null, usedCount: 38, active: true, createdAt: Date.now() - 60 * 86_400_000 },
    { code: "AH500", type: "fixed", value: 500, minOrder: 4000, maxDiscount: null, expiresAt: Date.now() + 20 * 86_400_000, usageLimit: 200, usedCount: 61, active: true, createdAt: Date.now() - 30 * 86_400_000 },
    { code: "EID25", type: "percent", value: 25, minOrder: 6000, maxDiscount: 3000, expiresAt: Date.now() - 5 * 86_400_000, usageLimit: 100, usedCount: 100, active: false, createdAt: Date.now() - 90 * 86_400_000 },
  ],
  messages: (): ContactMessage[] => [
    { id: "m1", name: "Sana Javed", email: "sana@gmail.com", phone: "+92 321 4567890", subject: "Size exchange", message: "Assalam o Alaikum, I received my order AH-260104 but the kurta is a bit loose. Can I exchange it for a size S?", read: false, repliedAt: null, createdAt: Date.now() - 2 * 3_600_000 },
    { id: "m2", name: "Omer Farooq", email: "omer.f@outlook.com", subject: "Bulk order for wedding", message: "We need 12 matching kurtas for a family wedding in December. Do you offer a discount for bulk orders?", read: false, repliedAt: null, createdAt: Date.now() - 26 * 3_600_000 },
    { id: "m3", name: "Iqra Aziz", email: "iqra.aziz@gmail.com", phone: "+92 300 7654321", subject: "Delivery to Gilgit", message: "Do you deliver to Gilgit? How many days does it take?", read: true, repliedAt: Date.now() - 40 * 3_600_000, createdAt: Date.now() - 50 * 3_600_000 },
  ],
  admins: (): AdminMember[] => [{ id: "demo-admin", uid: "demo-admin", email: "admin@ahclothinghub.pk", name: "Store Owner", role: "admin", permissions: ["*"], createdAt: Date.now() - 100 * 86_400_000 }],
};
