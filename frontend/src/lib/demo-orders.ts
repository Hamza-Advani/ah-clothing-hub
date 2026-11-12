/** Deterministic demo orders for UI previews before Firestore is connected. */
import { DUMMY_COST_RATIO, DUMMY_PRODUCTS } from "./dummy-data";
import type { Order, OrderPrivate, OrderStatus, PaymentMethod } from "./types";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Gujranwala", "Hyderabad"];
const NAMES = ["Ayesha Khan", "Hira Siddiqui", "Usman Raza", "Mahnoor Ali", "Bilal Tariq", "Fatima Zahra", "Hamza Iqbal", "Zainab Malik", "Ali Hassan", "Sana Javed", "Omer Farooq", "Maryam Nawaz", "Danish Akhtar", "Iqra Aziz", "Saad Qureshi"];
const STEPS: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export type DemoOrder = Order & { private: OrderPrivate };

export function generateDemoOrders(count = 160, days = 75, now = Date.now()): DemoOrder[] {
  const r = rng(42);
  const out: DemoOrder[] = [];
  for (let i = 0; i < count; i++) {
    const ageDays = Math.pow(r(), 1.35) * days; // denser recently
    const createdAt = now - ageDays * 86_400_000 - r() * 3_600_000;
    const n = 1 + Math.floor(r() * 3);
    const items = Array.from({ length: n }).map(() => {
      const p = DUMMY_PRODUCTS[Math.floor(r() * DUMMY_PRODUCTS.length)];
      const v = p.variants[Math.floor(r() * p.variants.length)];
      const qty = r() > 0.85 ? 2 : 1;
      const unit = p.salePrice ?? p.price;
      return { productId: p.id, name: p.name, slug: p.slug, image: p.images[0].url, size: v.size, color: v.color, qty, price: p.price, unitPrice: unit, discount: 0, lineTotal: unit * qty, _cost: Math.round(p.price * DUMMY_COST_RATIO) * qty, _cat: p.categorySlug };
    });
    const subtotal = items.reduce((a, it) => a + it.lineTotal, 0);
    const discount = r() > 0.8 ? Math.round(subtotal * 0.1) : 0;
    const deliveryCharge = subtotal - discount >= 5000 ? 0 : 250;
    const total = subtotal - discount + deliveryCharge;
    const pm: PaymentMethod = r() < 0.68 ? "cod" : r() < 0.6 ? "jazzcash" : "easypaisa";
    // older orders progress further
    let status: OrderStatus;
    if (r() < 0.07) status = "cancelled";
    else if (r() < 0.03) status = "returned";
    else {
      const progress = Math.min(4, Math.floor(ageDays / 1.4 + r() * 1.5));
      status = STEPS[progress];
    }
    const history = (status === "cancelled" || status === "returned" ? ["pending", "confirmed", status] : STEPS.slice(0, STEPS.indexOf(status) + 1)) as OrderStatus[];
    const cost = items.reduce((a, it) => a + it._cost, 0);
    const revenue = subtotal - discount;
    const name = NAMES[Math.floor(r() * NAMES.length)];
    const pstatus = pm === "cod" ? (status === "delivered" ? "paid" : "pending") : status === "pending" ? "awaiting_approval" : "paid";
    out.push({
      id: `demo-${i}`,
      orderNumber: `AH-${String(260100 + i)}`,
      userId: i % 9 === 0 ? "demo-me" : `u-${Math.floor(r() * 60)}`,
      customer: { name, phone: `+92 3${Math.floor(r() * 50 + 10)} ${Math.floor(1000000 + r() * 8999999)}`, email: `${name.split(" ")[0].toLowerCase()}${i}@gmail.com` },
      shipping: { address: `House ${Math.floor(r() * 300)}, Street ${Math.floor(r() * 40)}, Block ${"ABCDEFG"[Math.floor(r() * 7)]}`, city: CITIES[Math.floor(Math.pow(r(), 1.6) * CITIES.length)] },
      items: items.map(({ _cost, _cat, ...rest }) => { void _cost; void _cat; return rest; }),
      subtotal,
      discount,
      couponCode: discount ? "WELCOME10" : null,
      deliveryCharge,
      total,
      payment: { method: pm, status: pstatus, screenshot: pm === "cod" ? null : { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=70", publicId: "" }, txnId: pm === "cod" ? null : String(Math.floor(r() * 1e10)) },
      status,
      statusHistory: history.map((s, k) => ({ status: s, at: createdAt + k * 0.9 * 86_400_000 * (0.4 + r()), by: "system" })),
      courier: STEPS.indexOf(status) >= 3 ? { name: r() > 0.5 ? "TCS" : "Leopards", trackingNumber: `${Math.floor(1e9 + r() * 9e9)}` } : null,
      createdAt,
      private: { revenue, cost, profit: revenue - cost },
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}
