"use client";
import { useEffect, useMemo, useState } from "react";
import { useLiveCollection } from "./live";
import { demo, type AdminMember } from "./demo";
import type { Coupon, OrderStatus, UserProfile } from "@/lib/types";

export const useCustomers = () => useLiveCollection<UserProfile & { id: string }>("users", demo.customers as () => (UserProfile & { id: string })[], { order: "createdAt", max: 5000 });
export const useCoupons = () => useLiveCollection<Coupon & { id: string }>("coupons", demo.coupons as () => (Coupon & { id: string })[], { order: "createdAt" });
export const useAdmins = () => useLiveCollection<AdminMember>("admins", demo.admins);

/** Order statuses whose revenue/profit count in reports (Settings → profitCountsStatuses). */
export function useCounted(list: OrderStatus[] | undefined): OrderStatus[] {
  const key = (list ?? []).join(",");
  return useMemo(() => (key ? (key.split(",") as OrderStatus[]) : ["delivered"]), [key]);
}

/** Current time that refreshes every `ms` (keeps render pure). */
export function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
