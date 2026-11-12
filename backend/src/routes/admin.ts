import { Router } from "express";
import { z } from "zod";
import { adminAuth, db, FieldValue } from "../lib/firebase.js";
import { ah, HttpError, parse } from "../lib/http.js";
import { requireAdmin, requireStaff } from "../middleware/auth.js";
import { updateOrderStatus } from "../services/orders.js";
import { notify } from "../notifications/index.js";
import { destroyImage } from "../lib/cloudinary.js";

export const adminRouter = Router();
adminRouter.use(requireStaff);

const id = z.string().min(1).max(128);
const image = z.object({ url: z.string().url(), publicId: z.string().max(200).default(""), order: z.number().int().min(0), alt: z.string().max(200).optional() });

/* ---------------- Orders ---------------- */
adminRouter.patch(
  "/orders/:id/status",
  ah(async (req, res) => {
    const v = parse(z.object({ status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"]), note: z.string().max(300).optional(), courier: z.object({ name: z.string().trim().min(1).max(60), trackingNumber: z.string().trim().min(1).max(80) }).nullable().optional(), notify: z.boolean().default(true) }), req.body);
    if (v.status === "shipped" && !v.courier) {
      const cur = (await db().doc(`orders/${req.params.id}`).get()).data();
      if (!cur?.courier) throw new HttpError(400, "Add courier name and tracking number before marking as shipped.");
    }
    const o = await updateOrderStatus(String(req.params.id), v.status, req.user!.uid, { note: v.note, courier: v.courier });
    if (v.notify && o.previous !== v.status) notify.statusChanged(o as never, v.status).catch(console.error);
    res.json({ ok: true });
  }),
);

adminRouter.patch(
  "/orders/:id/courier",
  ah(async (req, res) => {
    const v = parse(z.object({ name: z.string().trim().min(1).max(60), trackingNumber: z.string().trim().min(1).max(80) }), req.body);
    await db().doc(`orders/${req.params.id}`).update({ courier: v, updatedAt: FieldValue.serverTimestamp() });
    res.json({ ok: true });
  }),
);

adminRouter.patch(
  "/orders/:id/payment",
  ah(async (req, res) => {
    const { decision, note } = parse(z.object({ decision: z.enum(["approve", "reject"]), note: z.string().max(300).optional() }), req.body);
    const ref = db().doc(`orders/${req.params.id}`);
    const o = (await ref.get()).data();
    if (!o) throw new HttpError(404, "Order not found");
    if (o.payment.method === "cod") throw new HttpError(400, "COD orders don't need payment approval.");
    await ref.update({ "payment.status": decision === "approve" ? "paid" : "rejected", "payment.reviewedBy": req.user!.uid, "payment.note": note ?? "", updatedAt: FieldValue.serverTimestamp() });
    if (decision === "approve" && o.status === "pending") {
      const updated = await updateOrderStatus(String(req.params.id), "confirmed", req.user!.uid, { note: "Payment approved" });
      notify.statusChanged(updated as never, "confirmed").catch(console.error);
    }
    res.json({ ok: true });
  }),
);

adminRouter.post(
  "/email",
  ah(async (req, res) => {
    const v = parse(z.object({ to: z.string().email(), name: z.string().min(1).max(80), subject: z.string().min(2).max(150), message: z.string().min(2).max(5000), messageId: z.string().optional() }), req.body);
    await notify.custom(v.to, v.name, v.subject, v.message);
    if (v.messageId) await db().doc(`messages/${v.messageId}`).update({ repliedAt: FieldValue.serverTimestamp(), read: true });
    res.json({ ok: true });
  }),
);

/* ---------------- Products ---------------- */
const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(160),
  description: z.string().max(20000).default(""),
  categoryId: id,
  categorySlug: z.string().max(80),
  tags: z.array(z.string().max(40)).max(30).default([]),
  price: z.number().int().min(0),
  salePrice: z.number().int().min(0).nullable().default(null),
  costPrice: z.number().int().min(0).default(0),
  sku: z.string().max(60).default(""),
  sizes: z.array(z.string().max(20)).max(30),
  colors: z.array(z.object({ name: z.string().max(40), hex: z.string().max(9) })).max(30),
  variants: z.array(z.object({ size: z.string(), color: z.string(), stock: z.number().int().min(0) })).max(500),
  images: z.array(image).max(8),
  weight: z.number().min(0).optional(),
  material: z.string().max(200).optional(),
  care: z.string().max(500).optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
}).refine((p) => p.salePrice == null || p.salePrice < p.price, { path: ["salePrice"], message: "Sale price must be lower than price" });

async function saveProduct(pid: string | null, body: unknown) {
  const { costPrice, ...p } = parse(productSchema, body);
  const firestore = db();
  const dupe = await firestore.collection("products").where("slug", "==", p.slug).limit(2).get();
  if (dupe.docs.some((d) => d.id !== pid)) throw new HttpError(409, "Another product already uses this URL slug.");
  const ref = pid ? firestore.doc(`products/${pid}`) : firestore.collection("products").doc();
  const totalStock = p.variants.reduce((a, v) => a + v.stock, 0);
  const batch = firestore.batch();
  batch.set(ref, { ...p, totalStock, updatedAt: FieldValue.serverTimestamp(), ...(pid ? {} : { createdAt: FieldValue.serverTimestamp(), rating: 0, reviewCount: 0, soldCount: 0 }) }, { merge: true });
  batch.set(firestore.doc(`productsPrivate/${ref.id}`), { costPrice, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();
  return ref.id;
}

adminRouter.post("/products", ah(async (req, res) => res.status(201).json({ id: await saveProduct(null, req.body) })));
adminRouter.put("/products/:id", ah(async (req, res) => res.json({ id: await saveProduct(String(req.params.id), req.body) })));

adminRouter.delete(
  "/products/:id",
  requireAdmin,
  ah(async (req, res) => {
    const ref = db().doc(`products/${req.params.id}`);
    const p = (await ref.get()).data();
    await Promise.all([ref.delete(), db().doc(`productsPrivate/${req.params.id}`).delete()]);
    await Promise.all((p?.images ?? []).map((i: { publicId: string }) => destroyImage(i.publicId)));
    res.json({ ok: true });
  }),
);

adminRouter.post(
  "/products/bulk",
  ah(async (req, res) => {
    const v = parse(z.object({ ids: z.array(id).min(1).max(400), action: z.enum(["delete", "hide", "show", "category", "stock"]), categoryId: z.string().optional(), categorySlug: z.string().optional(), stock: z.number().int().min(0).optional() }), req.body);
    if (v.action === "delete" && req.user!.role !== "admin") throw new HttpError(403, "Only admins can delete products.");
    const firestore = db();
    for (let i = 0; i < v.ids.length; i += 200) {
      const batch = firestore.batch();
      const chunk = v.ids.slice(i, i + 200);
      const snaps = v.action === "stock" ? await firestore.getAll(...chunk.map((x) => firestore.doc(`products/${x}`))) : [];
      chunk.forEach((pid, k) => {
        const ref = firestore.doc(`products/${pid}`);
        if (v.action === "delete") { batch.delete(ref); batch.delete(firestore.doc(`productsPrivate/${pid}`)); }
        if (v.action === "hide" || v.action === "show") batch.update(ref, { active: v.action === "show" });
        if (v.action === "category") batch.update(ref, { categoryId: v.categoryId, categorySlug: v.categorySlug });
        if (v.action === "stock") {
          const variants = ((snaps[k]?.data()?.variants ?? []) as { size: string; color: string; stock: number }[]).map((x) => ({ ...x, stock: v.stock ?? 0 }));
          batch.update(ref, { variants, totalStock: variants.reduce((a, x) => a + x.stock, 0) });
        }
      });
      await batch.commit();
    }
    res.json({ ok: true });
  }),
);

/* ---------------- Generic CRUD for simple collections ---------------- */
const categorySchema = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().max(300).default(""), image: z.object({ url: z.string().url(), publicId: z.string().default("") }), order: z.number().int().default(0), active: z.boolean().default(true) });
const couponSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/), type: z.enum(["percent", "fixed"]), value: z.number().positive(), minOrder: z.number().min(0).default(0), maxDiscount: z.number().positive().nullable().default(null), expiresAt: z.number().nullable().default(null), usageLimit: z.number().int().positive().nullable().default(null), active: z.boolean().default(true) }).refine((c) => c.type !== "percent" || c.value <= 90, { path: ["value"], message: "Max 90%" });

adminRouter.post("/categories", ah(async (req, res) => res.status(201).json({ id: (await db().collection("categories").add({ ...parse(categorySchema, req.body), createdAt: FieldValue.serverTimestamp() })).id })));
adminRouter.put("/categories/:id", ah(async (req, res) => { await db().doc(`categories/${req.params.id}`).set(parse(categorySchema, req.body), { merge: true }); res.json({ ok: true }); }));
adminRouter.delete("/categories/:id", requireAdmin, ah(async (req, res) => {
  const inUse = await db().collection("products").where("categoryId", "==", req.params.id).limit(1).get();
  if (!inUse.empty) throw new HttpError(409, "Move or delete the products in this category first.");
  await db().doc(`categories/${req.params.id}`).delete();
  res.json({ ok: true });
}));

adminRouter.post("/coupons", ah(async (req, res) => {
  const c = parse(couponSchema, req.body);
  const ref = db().doc(`coupons/${c.code}`);
  if ((await ref.get()).exists) throw new HttpError(409, "A coupon with this code already exists.");
  await ref.set({ ...c, usedCount: 0, createdAt: FieldValue.serverTimestamp() });
  res.status(201).json({ ok: true });
}));
adminRouter.put("/coupons/:code", ah(async (req, res) => { const { code: _c, ...rest } = parse(couponSchema, req.body); void _c; await db().doc(`coupons/${req.params.code}`).set(rest, { merge: true }); res.json({ ok: true }); }));
adminRouter.delete("/coupons/:code", ah(async (req, res) => { await db().doc(`coupons/${req.params.code}`).delete(); res.json({ ok: true }); }));

/* ---------------- Reviews ---------------- */
async function recomputeRating(productId: string) {
  const snaps = await db().collection("reviews").where("productId", "==", productId).where("status", "==", "approved").get();
  const ratings = snaps.docs.map((d) => d.data().rating as number);
  const avg = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  await db().doc(`products/${productId}`).update({ rating: avg, reviewCount: ratings.length });
}
adminRouter.patch("/reviews/:id", ah(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(["approved", "hidden", "pending"]) }), req.body);
  const ref = db().doc(`reviews/${req.params.id}`);
  const r = (await ref.get()).data();
  if (!r) throw new HttpError(404, "Review not found");
  await ref.update({ status });
  await recomputeRating(r.productId);
  res.json({ ok: true });
}));
adminRouter.delete("/reviews/:id", ah(async (req, res) => {
  const ref = db().doc(`reviews/${req.params.id}`);
  const r = (await ref.get()).data();
  await ref.delete();
  if (r) await recomputeRating(r.productId);
  res.json({ ok: true });
}));

/* ---------------- Customers ---------------- */
adminRouter.patch("/customers/:uid/block", requireAdmin, ah(async (req, res) => {
  const { blocked } = parse(z.object({ blocked: z.boolean() }), req.body);
  await Promise.all([db().doc(`users/${req.params.uid}`).set({ blocked }, { merge: true }), adminAuth().updateUser(String(req.params.uid), { disabled: blocked })]);
  if (blocked) await adminAuth().revokeRefreshTokens(String(req.params.uid));
  res.json({ ok: true });
}));

/* ---------------- Messages ---------------- */
adminRouter.patch("/messages/:id", ah(async (req, res) => { const { read } = parse(z.object({ read: z.boolean() }), req.body); await db().doc(`messages/${req.params.id}`).update({ read }); res.json({ ok: true }); }));
adminRouter.delete("/messages/:id", ah(async (req, res) => { await db().doc(`messages/${req.params.id}`).delete(); res.json({ ok: true }); }));

/* ---------------- Settings & pages (admin only) ---------------- */
adminRouter.put("/settings/:doc", requireAdmin, ah(async (req, res) => {
  const docId = parse(z.enum(["store", "pages"]), req.params.doc);
  const data = parse(z.record(z.string(), z.unknown()), req.body);
  if (JSON.stringify(data).length > 400_000) throw new HttpError(413, "Settings payload too large.");
  await db().doc(`settings/${docId}`).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  res.json({ ok: true });
}));

/* ---------------- Admin users (admin only) ---------------- */
adminRouter.post("/admins", requireAdmin, ah(async (req, res) => {
  const v = parse(z.object({ email: z.string().email(), role: z.enum(["admin", "staff"]), permissions: z.array(z.string().max(40)).max(30).default([]) }), req.body);
  const user = await adminAuth().getUserByEmail(v.email).catch(() => { throw new HttpError(404, "No account with this email. Ask them to sign up on the website first."); });
  await adminAuth().setCustomUserClaims(user.uid, { role: v.role });
  await Promise.all([
    db().doc(`admins/${user.uid}`).set({ uid: user.uid, email: v.email, name: user.displayName ?? "", role: v.role, permissions: v.permissions, createdAt: FieldValue.serverTimestamp() }, { merge: true }),
    db().doc(`users/${user.uid}`).set({ role: v.role }, { merge: true }),
  ]);
  res.status(201).json({ ok: true, uid: user.uid });
}));
adminRouter.delete("/admins/:uid", requireAdmin, ah(async (req, res) => {
  if (req.params.uid === req.user!.uid) throw new HttpError(400, "You can't remove your own admin access.");
  await adminAuth().setCustomUserClaims(String(req.params.uid), { role: "customer" });
  await Promise.all([db().doc(`admins/${req.params.uid}`).delete(), db().doc(`users/${req.params.uid}`).set({ role: "customer" }, { merge: true })]);
  res.json({ ok: true });
}));
