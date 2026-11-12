import { db, FieldValue } from "../lib/firebase.js";
import { HttpError } from "../lib/http.js";
import { DEFAULT_SETTINGS, type Coupon, type OrderStatus, type PaymentMethod, type ProductDoc, type StoreSettings } from "../lib/types.js";
import { allocateDiscount, couponDiscount, deliveryFor, validateCoupon } from "./pricing.js";
import { getProvider, type PaymentInput } from "../payments/index.js";

export type CreateOrderInput = {
  customer: { name: string; phone: string; email: string };
  shipping: { address: string; city: string; notes?: string };
  items: { productId: string; size: string; color: string; qty: number }[];
  couponCode: string | null;
  payment: PaymentInput;
  saveAddress?: boolean;
};

export async function getSettings(): Promise<StoreSettings> {
  const s = await db().doc("settings/store").get();
  return { ...DEFAULT_SETTINGS, ...(s.data() as Partial<StoreSettings> | undefined) };
}

/**
 * Creates an order atomically. Every price, discount, delivery charge and total is
 * recalculated here from Firestore — values from the browser are ignored.
 */
export async function createOrder(input: CreateOrderInput, userId: string | null) {
  const firestore = db();
  const settings = await getSettings();
  if (settings.citiesServed.length && !settings.citiesServed.includes(input.shipping.city)) throw new HttpError(400, "Sorry, we don't deliver to this city yet.");
  const provider = getProvider(input.payment.method as PaymentMethod, settings);

  // merge duplicate lines
  const merged = new Map<string, CreateOrderInput["items"][number]>();
  for (const it of input.items) {
    const k = `${it.productId}|${it.size}|${it.color}`;
    const prev = merged.get(k);
    merged.set(k, prev ? { ...prev, qty: prev.qty + it.qty } : { ...it });
  }
  const lines = [...merged.values()];
  const productIds = [...new Set(lines.map((l) => l.productId))];

  const result = await firestore.runTransaction(async (tx) => {
    // ---------- reads ----------
    const productRefs = productIds.map((id) => firestore.doc(`products/${id}`));
    const privateRefs = productIds.map((id) => firestore.doc(`productsPrivate/${id}`));
    const [productSnaps, privateSnaps] = await Promise.all([tx.getAll(...productRefs), tx.getAll(...privateRefs)]);
    const counterRef = firestore.doc("counters/orders");
    const counterSnap = await tx.get(counterRef);
    const code = input.couponCode?.trim().toUpperCase() || null;
    const couponRef = code ? firestore.doc(`coupons/${code}`) : null;
    const couponSnap = couponRef ? await tx.get(couponRef) : null;

    const products = new Map<string, ProductDoc>();
    const costs = new Map<string, number>();
    productSnaps.forEach((s, i) => {
      if (!s.exists) throw new HttpError(400, "A product in your bag is no longer available.");
      const p = s.data() as ProductDoc;
      if (!p.active) throw new HttpError(400, `“${p.name}” is no longer available.`);
      products.set(s.id, p);
      costs.set(s.id, Number(privateSnaps[i].data()?.costPrice ?? 0));
    });

    // ---------- pricing ----------
    const priced = lines.map((l) => {
      const p = products.get(l.productId)!;
      const v = p.variants.find((x) => x.size === l.size && x.color === l.color);
      if (!v) throw new HttpError(400, `Selected size/colour for “${p.name}” is unavailable.`);
      if (v.stock < l.qty) throw new HttpError(409, v.stock === 0 ? `“${p.name}” (${l.color}/${l.size}) just sold out.` : `Only ${v.stock} left of “${p.name}” (${l.color}/${l.size}).`);
      const unitPrice = p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
      const image = [...(p.images ?? [])].sort((a, b) => a.order - b.order)[0]?.url ?? "";
      return { productId: l.productId, name: p.name, slug: p.slug, image, size: l.size, color: l.color, qty: l.qty, price: p.price, unitPrice, lineTotal: unitPrice * l.qty, categorySlug: p.categorySlug };
    });
    const subtotal = priced.reduce((a, l) => a + l.lineTotal, 0);
    const coupon = couponSnap ? validateCoupon(couponSnap.exists ? (couponSnap.data() as Coupon) : undefined, subtotal) : null;
    const discount = couponDiscount(coupon, subtotal);
    const shares = allocateDiscount(priced.map((l) => l.lineTotal), discount);
    const deliveryCharge = deliveryFor(subtotal - discount, settings);
    const total = subtotal - discount + deliveryCharge;

    // profit = selling price − cost − discount (delivery excluded)
    const costLines = priced.map((l) => ({ productId: l.productId, costPrice: costs.get(l.productId) ?? 0, qty: l.qty }));
    const cost = costLines.reduce((a, c) => a + c.costPrice * c.qty, 0);
    const revenue = subtotal - discount;

    const next = (counterSnap.data()?.next as number | undefined) ?? 260001;
    const orderNumber = `AH-${next}`;
    const pay = await provider.init(input.payment, { orderNumber, amount: total });

    // ---------- writes ----------
    for (const [id, p] of products) {
      const variants = p.variants.map((v) => {
        const l = lines.find((x) => x.productId === id && x.size === v.size && x.color === v.color);
        return l ? { ...v, stock: v.stock - l.qty } : v;
      });
      const sold = lines.filter((x) => x.productId === id).reduce((a, x) => a + x.qty, 0);
      tx.update(firestore.doc(`products/${id}`), {
        variants,
        totalStock: variants.reduce((a, v) => a + v.stock, 0),
        soldCount: FieldValue.increment(sold),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.set(counterRef, { next: next + 1 }, { merge: true });
    if (couponRef && coupon) tx.update(couponRef, { usedCount: FieldValue.increment(1) });

    const orderRef = firestore.collection("orders").doc();
    const now = Date.now();
    tx.set(orderRef, {
      orderNumber,
      userId,
      customer: input.customer,
      shipping: { address: input.shipping.address, city: input.shipping.city, notes: input.shipping.notes ?? "" },
      items: priced.map((l, i) => ({ productId: l.productId, name: l.name, slug: l.slug, image: l.image, size: l.size, color: l.color, qty: l.qty, price: l.price, unitPrice: l.unitPrice, discount: shares[i], lineTotal: l.lineTotal, categorySlug: l.categorySlug })),
      subtotal,
      discount,
      couponCode: coupon?.code ?? null,
      deliveryCharge,
      total,
      payment: { method: input.payment.method, status: pay.status, screenshot: input.payment.screenshot ?? null, txnId: input.payment.txnId ?? null },
      status: "pending",
      statusHistory: [{ status: "pending", at: now, by: "customer" }],
      courier: null,
      stockRestored: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(firestore.doc(`ordersPrivate/${orderRef.id}`), { revenue, cost, profit: revenue - cost, items: costLines, createdAt: FieldValue.serverTimestamp() });

    if (userId) {
      const userUpdate: Record<string, unknown> = { ordersCount: FieldValue.increment(1), totalSpent: FieldValue.increment(total), updatedAt: FieldValue.serverTimestamp() };
      tx.set(firestore.doc(`users/${userId}`), userUpdate, { merge: true });
    }
    return { orderId: orderRef.id, orderNumber, total, paymentStatus: pay.status, items: priced, subtotal, discount, deliveryCharge };
  });

  if (userId && input.saveAddress) {
    const ref = firestore.doc(`users/${userId}`);
    const u = (await ref.get()).data();
    const list = (u?.addresses ?? []) as { address: string; city: string }[];
    if (!list.some((a) => a.address === input.shipping.address && a.city === input.shipping.city)) {
      await ref.set(
        { addresses: [...list, { id: crypto.randomUUID(), label: list.length ? "Address " + (list.length + 1) : "Home", name: input.customer.name, phone: input.customer.phone, address: input.shipping.address, city: input.shipping.city, isDefault: list.length === 0 }] },
        { merge: true },
      );
    }
  }
  return result;
}

const FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

/** Admin status change with history; stock is restored once on cancel/return. */
export async function updateOrderStatus(orderId: string, status: OrderStatus, by: string, opts: { note?: string; courier?: { name: string; trackingNumber: string } | null }) {
  const firestore = db();
  return firestore.runTransaction(async (tx) => {
    const ref = firestore.doc(`orders/${orderId}`);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "Order not found");
    const o = snap.data()!;
    const from = o.status as OrderStatus;
    if (from === status && !opts.courier) throw new HttpError(400, `Order is already ${status}.`);
    if ((from === "cancelled" || from === "returned") && status !== from) throw new HttpError(400, "This order is closed and can't be changed.");
    if (status === "returned" && from !== "delivered" && from !== "shipped") throw new HttpError(400, "Only shipped or delivered orders can be marked returned.");
    if (FLOW.includes(status) && FLOW.includes(from) && FLOW.indexOf(status) < FLOW.indexOf(from)) throw new HttpError(400, "Orders can't move backwards in the flow.");

    const restore = (status === "cancelled" || status === "returned") && !o.stockRestored;
    let productSnaps: FirebaseFirestore.DocumentSnapshot[] = [];
    const items = o.items as { productId: string; size: string; color: string; qty: number }[];
    if (restore) productSnaps = await tx.getAll(...[...new Set(items.map((i) => i.productId))].map((id) => firestore.doc(`products/${id}`)));

    if (restore) {
      for (const ps of productSnaps) {
        if (!ps.exists) continue;
        const p = ps.data() as ProductDoc;
        const variants = p.variants.map((v) => {
          const qty = items.filter((i) => i.productId === ps.id && i.size === v.size && i.color === v.color).reduce((a, i) => a + i.qty, 0);
          return qty ? { ...v, stock: v.stock + qty } : v;
        });
        const sold = items.filter((i) => i.productId === ps.id).reduce((a, i) => a + i.qty, 0);
        tx.update(ps.ref, { variants, totalStock: variants.reduce((a, v) => a + v.stock, 0), soldCount: FieldValue.increment(-sold) });
      }
      if (o.userId) tx.set(firestore.doc(`users/${o.userId}`), { totalSpent: FieldValue.increment(-o.total) }, { merge: true });
    }
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (from !== status) {
      update.status = status;
      update.statusHistory = FieldValue.arrayUnion({ status, at: Date.now(), by, note: opts.note ?? "" });
    }
    if (opts.courier !== undefined) update.courier = opts.courier;
    if (restore) update.stockRestored = true;
    if (status === "delivered" && o.payment?.method === "cod") update["payment.status"] = "paid";
    tx.update(ref, update);
    return { ...o, id: orderId, status, courier: opts.courier !== undefined ? opts.courier : o.courier, previous: from };
  });
}
