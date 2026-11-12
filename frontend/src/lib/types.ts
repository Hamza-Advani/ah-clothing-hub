export type ProductImage = { url: string; publicId: string; order: number; alt?: string };
export type ProductColor = { name: string; hex: string };
export type ProductVariant = { size: string; color: string; stock: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string; // html
  categoryId: string;
  categorySlug: string;
  tags: string[];
  price: number;
  salePrice: number | null;
  sku: string;
  sizes: string[];
  colors: ProductColor[];
  variants: ProductVariant[];
  totalStock: number;
  images: ProductImage[];
  weight?: number;
  material?: string;
  care?: string;
  active: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: number;
  updatedAt?: number;
};

/** Admin-only product fields (stored in productsPrivate/{id}) */
export type ProductPrivate = { costPrice: number };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: { url: string; publicId: string };
  order: number;
  active: boolean;
};

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
};

export type UserRole = "customer" | "staff" | "admin";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string | null;
  role: UserRole;
  blocked: boolean;
  addresses: Address[];
  wishlist: string[];
  ordersCount: number;
  totalSpent: number;
  createdAt: number;
  updatedAt?: number;
};

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentMethod = "cod" | "jazzcash" | "easypaisa";
export type PaymentStatus = "pending" | "awaiting_approval" | "paid" | "rejected";

export type OrderItem = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  qty: number;
  price: number; // original price
  unitPrice: number; // charged per unit (sale price if any)
  discount: number; // coupon share for this line
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customer: { name: string; phone: string; email: string };
  shipping: { address: string; city: string; notes?: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  deliveryCharge: number;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    screenshot: { url: string; publicId: string } | null;
    txnId: string | null;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: number; by?: string; note?: string }[];
  courier: { name: string; trackingNumber: string } | null;
  createdAt: number;
  updatedAt?: number;
};

export type OrderPrivate = { revenue: number; cost: number; profit: number };

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  status: "pending" | "approved" | "hidden";
  createdAt: number;
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
  createdAt: number;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  repliedAt: number | null;
  createdAt: number;
};

export type HeroBanner = {
  id: string;
  image: string;
  mobileImage?: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  order: number;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  logo: string | null;
  favicon: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  socials: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string };
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  citiesServed: string[];
  profitCountsStatuses: OrderStatus[];
  payments: {
    cod: { enabled: boolean };
    jazzcash: { enabled: boolean; accountTitle: string; accountNumber: string };
    easypaisa: { enabled: boolean; accountTitle: string; accountNumber: string };
  };
  announcement: string[];
  heroBanners: HeroBanner[];
  templates: {
    whatsapp: Partial<Record<OrderStatus, string>>;
    email: Partial<Record<OrderStatus, { subject: string; body: string }>>;
  };
};

export type PagesContent = {
  about: string;
  returns: string;
  privacy: string;
  terms: string;
  faq: { q: string; a: string }[];
};

export type CartItem = {
  key: string; // productId|size|color
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  salePrice: number | null;
  size: string;
  color: string;
  qty: number;
  maxStock: number;
};
