"use client";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLiveCollection, useLiveDoc } from "@/lib/admin/live";
import { demo, type CostDoc, type PrivateDoc } from "@/lib/admin/demo";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { formatPKR } from "@/lib/utils";
import type { Category, ContactMessage, Order, Product, Review, StoreSettings } from "@/lib/types";

type AdminData = {
  orders: Order[] | null;
  ordersError: string | null;
  priv: Map<string, PrivateDoc>;
  products: Product[] | null;
  costs: Map<string, number>;
  costsReady: boolean;
  categories: Category[] | null;
  messages: ContactMessage[] | null;
  reviews: Review[] | null;
  settings: StoreSettings;
  settingsReady: boolean;
};

const Ctx = createContext<AdminData | null>(null);

/** Plays a short two-tone chime (Web Audio — no audio file needed). */
function chime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [880, 1318].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {}
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const o = useLiveCollection<Order>("orders", demo.orders, { order: "createdAt", max: 3000 });
  const p = useLiveCollection<PrivateDoc>("ordersPrivate", demo.ordersPrivate);
  const pr = useLiveCollection<Product>("products", demo.products, { order: "createdAt" });
  const pp = useLiveCollection<CostDoc>("productsPrivate", demo.productsPrivate);
  const c = useLiveCollection<Category>("categories", demo.categories, { order: "order", dir: "asc" });
  const m = useLiveCollection<ContactMessage>("messages", demo.messages, { order: "createdAt", max: 500 });
  const r = useLiveCollection<Review>("reviews", demo.reviews, { order: "createdAt", max: 1000 });
  const s = useLiveDoc<StoreSettings>("settings/store", demo.settings);

  // ---- New order alert (sound + toast) ----
  const router = useRouter();
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!o.data) return;
    if (!seen.current) {
      seen.current = new Set(o.data.map((x) => x.id));
      return;
    }
    const fresh = o.data.filter((x) => !seen.current!.has(x.id));
    fresh.forEach((x) => seen.current!.add(x.id));
    if (fresh.length) {
      chime();
      for (const n of fresh.slice(0, 3)) {
        toast.success(`New order ${n.orderNumber}`, { description: `${n.customer.name} · ${n.shipping.city} · ${formatPKR(n.total)}`, action: { label: "View", onClick: () => router.push(`/admin/orders/${n.id}`) } });
      }
    }
  }, [o.data, router]);

  const value = useMemo<AdminData>(
    () => ({
      orders: o.data,
      ordersError: o.error,
      priv: new Map((p.data ?? []).map((x) => [x.id, x])),
      products: pr.data,
      costs: new Map((pp.data ?? []).map((x) => [x.id, x.costPrice ?? 0])),
      costsReady: pp.data !== null || !!pp.error,
      categories: c.data,
      messages: m.data,
      reviews: r.data,
      settings: { ...DEFAULT_SETTINGS, ...(s ?? {}), payments: { ...DEFAULT_SETTINGS.payments, ...(s?.payments ?? {}) }, templates: { whatsapp: { ...DEFAULT_SETTINGS.templates.whatsapp, ...(s?.templates?.whatsapp ?? {}) }, email: { ...(s?.templates?.email ?? {}) } } },
      settingsReady: s !== undefined,
    }),
    [o.data, o.error, p.data, pr.data, pp.data, pp.error, c.data, m.data, r.data, s],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminData must be used inside <AdminDataProvider>");
  return v;
}
