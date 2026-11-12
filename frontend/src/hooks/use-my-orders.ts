"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";
import { generateDemoOrders } from "@/lib/demo-orders";
import { useAuth } from "@/components/providers/auth-provider";
import type { Order } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toMillis(v: any): number {
  return typeof v === "number" ? v : v?.toMillis?.() ?? Date.now();
}
export function normalizeOrder(id: string, d: any): Order {
  return { ...d, id, createdAt: toMillis(d.createdAt), statusHistory: (d.statusHistory ?? []).map((h: any) => ({ ...h, at: toMillis(h.at) })) } as Order;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const demoMine = () => generateDemoOrders(40, 30).filter((o) => o.userId === "demo-me").slice(0, 4);

/** Live list of the signed-in customer's orders. */
export function useMyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const demo = useMemo(() => (user && !isFirebaseConfigured ? demoMine() : null), [user]);
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const { db } = getFirebase()!;
    const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setOrders(s.docs.map((d) => normalizeOrder(d.id, d.data()))), () => setOrders([]));
  }, [user]);
  return demo ?? orders;
}

/** Live single order (customer can only read their own — enforced by Firestore rules). */
export function useMyOrder(id: string) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const demo = useMemo(() => (user && !isFirebaseConfigured ? demoMine().find((o) => o.id === id) ?? null : undefined), [user, id]);
  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const { db } = getFirebase()!;
    return onSnapshot(doc(db, "orders", id), (s) => setOrder(s.exists() ? normalizeOrder(s.id, s.data()) : null), () => setOrder(null));
  }, [user, id]);
  return demo !== undefined ? demo : order;
}
