export const PERMISSIONS = [
  { key: "orders", label: "Orders" },
  { key: "products", label: "Products & categories" },
  { key: "customers", label: "Customers" },
  { key: "coupons", label: "Coupons" },
  { key: "reviews", label: "Reviews" },
  { key: "messages", label: "Messages" },
  { key: "analytics", label: "Analytics & profit" },
] as const;

/** Which permission key each admin route needs (staff only — admins see everything). */
export const ROUTE_PERMISSION: Record<string, string> = {
  "/admin/analytics": "analytics",
  "/admin/orders": "orders",
  "/admin/products": "products",
  "/admin/categories": "products",
  "/admin/customers": "customers",
  "/admin/coupons": "coupons",
  "/admin/reviews": "reviews",
  "/admin/messages": "messages",
};
