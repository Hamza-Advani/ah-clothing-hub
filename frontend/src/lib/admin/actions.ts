"use client";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

/** Runs an admin API call with friendly toasts. Returns the result or null on failure. */
export async function run<T>(p: Promise<T>, success?: string): Promise<T | null> {
  try {
    const r = await p;
    if (success) toast.success(success);
    return r;
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Something went wrong";
    const details = e instanceof ApiError ? (e.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors : undefined;
    const first = details ? Object.entries(details).find(([, v]) => v?.length) : undefined;
    toast.error(msg, first ? { description: `${first[0]}: ${first[1][0]}` } : undefined);
    return null;
  }
}

export const adminApi = {
  orderStatus: (id: string, body: { status: string; note?: string; courier?: { name: string; trackingNumber: string } | null; notify?: boolean }) => api.patch(`/api/admin/orders/${id}/status`, body),
  orderCourier: (id: string, body: { name: string; trackingNumber: string }) => api.patch(`/api/admin/orders/${id}/courier`, body),
  orderPayment: (id: string, decision: "approve" | "reject", note?: string) => api.patch(`/api/admin/orders/${id}/payment`, { decision, note }),
  email: (body: { to: string; name: string; subject: string; message: string; messageId?: string }) => api.post(`/api/admin/email`, body),

  createProduct: (body: unknown) => api.post<{ id: string }>(`/api/admin/products`, body),
  updateProduct: (id: string, body: unknown) => api.put<{ id: string }>(`/api/admin/products/${id}`, body),
  deleteProduct: (id: string) => api.delete(`/api/admin/products/${id}`),
  bulkProducts: (body: { ids: string[]; action: "delete" | "hide" | "show" | "category" | "stock"; categoryId?: string; categorySlug?: string; stock?: number }) => api.post(`/api/admin/products/bulk`, body),

  createCategory: (body: unknown) => api.post<{ id: string }>(`/api/admin/categories`, body),
  updateCategory: (id: string, body: unknown) => api.put(`/api/admin/categories/${id}`, body),
  deleteCategory: (id: string) => api.delete(`/api/admin/categories/${id}`),

  createCoupon: (body: unknown) => api.post(`/api/admin/coupons`, body),
  updateCoupon: (code: string, body: unknown) => api.put(`/api/admin/coupons/${code}`, body),
  deleteCoupon: (code: string) => api.delete(`/api/admin/coupons/${code}`),

  reviewStatus: (id: string, status: "approved" | "hidden" | "pending") => api.patch(`/api/admin/reviews/${id}`, { status }),
  deleteReview: (id: string) => api.delete(`/api/admin/reviews/${id}`),

  blockCustomer: (uid: string, blocked: boolean) => api.patch(`/api/admin/customers/${uid}/block`, { blocked }),

  messageRead: (id: string, read: boolean) => api.patch(`/api/admin/messages/${id}`, { read }),
  deleteMessage: (id: string) => api.delete(`/api/admin/messages/${id}`),

  saveSettings: (doc: "store" | "pages", data: Record<string, unknown>) => api.put(`/api/admin/settings/${doc}`, data),

  addAdmin: (body: { email: string; role: "admin" | "staff"; permissions: string[] }) => api.post(`/api/admin/admins`, body),
  removeAdmin: (uid: string) => api.delete(`/api/admin/admins/${uid}`),
};
