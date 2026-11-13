export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentMethod = "cod" | "jazzcash" | "easypaisa";
export type PaymentStatus = "pending" | "awaiting_approval" | "paid" | "rejected";

export type Variant = { size: string; color: string; stock: number };
export type ProductDoc = {
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: { url: string; publicId: string; order: number }[];
  variants: Variant[];
  totalStock: number;
  active: boolean;
  categoryId: string;
  categorySlug: string;
};

export type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  expiresAt: number | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

export type StoreSettings = {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  citiesServed: string[];
  payments: {
    cod: { enabled: boolean };
    jazzcash: { enabled: boolean; accountTitle: string; accountNumber: string };
    easypaisa: { enabled: boolean; accountTitle: string; accountNumber: string };
  };
  templates?: { email?: Partial<Record<OrderStatus, { subject: string; body: string }>>; whatsapp?: Partial<Record<OrderStatus, string>> };
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "AH Clothing Hub",
  email: "",
  phone: "",
  whatsapp: "",
  deliveryCharge: 250,
  freeDeliveryThreshold: 5000,
  citiesServed: [],
  payments: {
    cod: { enabled: true },
    jazzcash: { enabled: false, accountTitle: "", accountNumber: "" },
    easypaisa: { enabled: false, accountTitle: "", accountNumber: "" },
  },
};
