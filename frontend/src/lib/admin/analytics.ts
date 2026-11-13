import type { Order, OrderStatus, Product, UserProfile } from "@/lib/types";
import type { PrivateDoc } from "./demo";

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "year" | "custom";
export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  year: "This year",
  custom: "Custom",
};

export type Range = { start: number; end: number; prevStart: number; prevEnd: number; bucket: "hour" | "day" | "month"; label: string };

const DAY = 86_400_000;
const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function getRange(key: RangeKey, custom?: { from: string; to: string }, now = new Date()): Range {
  const today = sod(now);
  let start = today;
  let end = now.getTime();
  switch (key) {
    case "today":
      break;
    case "yesterday":
      start = today - DAY;
      end = today - 1;
      break;
    case "7d":
      start = today - 6 * DAY;
      break;
    case "30d":
      start = today - 29 * DAY;
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1).getTime();
      break;
    case "custom": {
      const f = custom?.from ? sod(new Date(custom.from + "T00:00:00")) : today - 29 * DAY;
      const t = custom?.to ? sod(new Date(custom.to + "T00:00:00")) + DAY - 1 : end;
      start = Math.min(f, t);
      end = Math.max(f, t);
    }
  }
  const len = end - start + 1;
  const days = len / DAY;
  return { start, end, prevStart: start - len, prevEnd: start - 1, bucket: days <= 2 ? "hour" : days <= 92 ? "day" : "month", label: RANGE_LABELS[key] };
}

export const isClosed = (s: OrderStatus) => s === "cancelled" || s === "returned";
const inRange = (t: number, a: number, b: number) => t >= a && t <= b;

export type Metrics = { orders: number; sales: number; revenue: number; cost: number; profit: number; aov: number; newCustomers: number };

export function metrics(orders: Order[], priv: Map<string, PrivateDoc>, counted: OrderStatus[], users: UserProfile[] | null, a: number, b: number): Metrics {
  let n = 0, sales = 0, revenue = 0, cost = 0, profit = 0;
  for (const o of orders) {
    if (!inRange(o.createdAt, a, b)) continue;
    if (!isClosed(o.status)) {
      n++;
      sales += o.total;
    }
    if (counted.includes(o.status)) {
      const p = priv.get(o.id);
      if (p) {
        revenue += p.revenue;
        cost += p.cost;
        profit += p.profit;
      }
    }
  }
  const newCustomers = users ? users.filter((u) => inRange(u.createdAt, a, b)).length : 0;
  return { orders: n, sales, revenue, cost, profit, aov: n ? sales / n : 0, newCustomers };
}

export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return cur ? null : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

function bucketKey(t: number, bucket: Range["bucket"]) {
  const d = new Date(t);
  if (bucket === "hour") return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
  if (bucket === "day") return sod(d);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function bucketLabel(t: number, bucket: Range["bucket"], multiDay: boolean) {
  const d = new Date(t);
  if (bucket === "hour") return (multiDay ? d.toLocaleDateString("en-PK", { day: "numeric", month: "short" }) + " " : "") + d.toLocaleTimeString("en-PK", { hour: "numeric" });
  if (bucket === "day") return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-PK", { month: "short", year: "2-digit" });
}

export type SeriesPoint = { t: number; label: string; sales: number; revenue: number; cost: number; profit: number; orders: number; customers: number };

export function timeSeries(orders: Order[], priv: Map<string, PrivateDoc>, counted: OrderStatus[], users: UserProfile[] | null, r: Range): SeriesPoint[] {
  const points = new Map<number, SeriesPoint>();
  const multiDay = r.end - r.start > DAY;
  // pre-fill empty buckets so the axis is continuous
  let t = bucketKey(r.start, r.bucket);
  let guard = 0;
  while (t <= r.end && guard++ < 800) {
    points.set(t, { t, label: bucketLabel(t, r.bucket, multiDay), sales: 0, revenue: 0, cost: 0, profit: 0, orders: 0, customers: 0 });
    const d = new Date(t);
    t = r.bucket === "hour" ? t + 3_600_000 : r.bucket === "day" ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() : new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  }
  for (const o of orders) {
    if (!inRange(o.createdAt, r.start, r.end)) continue;
    const p = points.get(bucketKey(o.createdAt, r.bucket));
    if (!p) continue;
    if (!isClosed(o.status)) {
      p.orders++;
      p.sales += o.total;
    }
    if (counted.includes(o.status)) {
      const pv = priv.get(o.id);
      if (pv) {
        p.revenue += pv.revenue;
        p.cost += pv.cost;
        p.profit += pv.profit;
      }
    }
  }
  for (const u of users ?? []) {
    if (!inRange(u.createdAt, r.start, r.end)) continue;
    const p = points.get(bucketKey(u.createdAt, r.bucket));
    if (p) p.customers++;
  }
  return [...points.values()];
}

export const STATUS_GROUPS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "pending", label: "Pending", statuses: ["pending"] },
  { key: "processing", label: "Confirmed / packed", statuses: ["confirmed", "packed"] },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "closed", label: "Cancelled / returned", statuses: ["cancelled", "returned"] },
];

export function breakdowns(orders: Order[], products: Product[], r: Range) {
  const list = orders.filter((o) => inRange(o.createdAt, r.start, r.end));
  const live = list.filter((o) => !isClosed(o.status));
  const catOf = new Map(products.map((p) => [p.id, p.categorySlug]));

  const status = STATUS_GROUPS.map((g) => ({ name: g.label, key: g.key, value: list.filter((o) => g.statuses.includes(o.status)).length }));

  const payMap: Record<string, { name: string; value: number; amount: number }> = {
    cod: { name: "Cash on Delivery", value: 0, amount: 0 },
    jazzcash: { name: "JazzCash", value: 0, amount: 0 },
    easypaisa: { name: "EasyPaisa", value: 0, amount: 0 },
  };
  for (const o of live) {
    const m = payMap[o.payment.method];
    if (m) {
      m.value++;
      m.amount += o.total;
    }
  }

  const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
  const catMap = new Map<string, number>();
  const cityMap = new Map<string, { orders: number; sales: number }>();
  for (const o of live) {
    for (const it of o.items) {
      const pm = prodMap.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
      pm.qty += it.qty;
      pm.revenue += it.lineTotal - (it.discount ?? 0);
      prodMap.set(it.productId, pm);
      const cat = (it as { categorySlug?: string }).categorySlug ?? catOf.get(it.productId) ?? "other";
      catMap.set(cat, (catMap.get(cat) ?? 0) + it.lineTotal - (it.discount ?? 0));
    }
    const c = cityMap.get(o.shipping.city) ?? { orders: 0, sales: 0 };
    c.orders++;
    c.sales += o.total;
    cityMap.set(o.shipping.city, c);
  }

  return {
    status,
    payments: Object.values(payMap),
    topProducts: [...prodMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    categories: [...catMap.entries()].map(([slug, value]) => ({ slug, value })).sort((a, b) => b.value - a.value),
    cities: [...cityMap.entries()].map(([city, v]) => ({ city, ...v })).sort((a, b) => b.sales - a.sales).slice(0, 10),
  };
}

export const compactPKR = (n: number) => {
  const a = Math.abs(n);
  if (a >= 10_000_000) return `${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (a >= 100_000) return `${(n / 100_000).toFixed(1).replace(/\.0$/, "")} Lac`;
  if (a >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(n));
};
