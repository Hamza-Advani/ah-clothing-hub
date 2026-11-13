import { Router } from "express";
import { z } from "zod";
import { db, FieldValue } from "../lib/firebase.js";
import { ah, HttpError, parse } from "../lib/http.js";
import { optionalAuth, requireAuth, requireStaff } from "../middleware/auth.js";
import { strictLimiter, uploadLimiter } from "../middleware/rate-limit.js";
import { createOrder } from "../services/orders.js";
import { validateCoupon } from "../services/pricing.js";
import { signUpload } from "../lib/cloudinary.js";
import { notify } from "../notifications/index.js";
import type { Coupon } from "../lib/types.js";

export const publicRouter = Router();

const phone = z.string().trim().regex(/^(\+92|0|92)?3\d{2}[\s-]?\d{7}$/, "Invalid Pakistani mobile number");
const str = (min: number, max: number) => z.string().trim().min(min).max(max);

const orderSchema = z.object({
  customer: z.object({ name: str(2, 80), phone, email: z.string().trim().email() }),
  shipping: z.object({ address: str(8, 300), city: str(2, 60), notes: z.string().max(500).optional() }),
  items: z.array(z.object({ productId: str(1, 64), size: str(1, 20), color: str(1, 40), qty: z.number().int().min(1).max(20) })).min(1).max(50),
  couponCode: z.string().trim().max(40).nullable().optional().default(null),
  payment: z.object({
    method: z.enum(["cod", "jazzcash", "easypaisa"]),
    txnId: z.string().max(60).nullable().optional().default(null),
    screenshot: z.object({ url: z.string().url(), publicId: z.string().max(200) }).nullable().optional().default(null),
  }),
  saveAddress: z.boolean().optional(),
});

publicRouter.post(
  "/orders",
  strictLimiter,
  optionalAuth,
  ah(async (req, res) => {
    const input = parse(orderSchema, req.body);
    if (req.user) {
      const u = await db().doc(`users/${req.user.uid}`).get();
      if (u.data()?.blocked) throw new HttpError(403, "Your account is restricted. Please contact support.");
    }
    const order = await createOrder({ ...input, couponCode: input.couponCode ?? null, payment: { method: input.payment.method, txnId: input.payment.txnId ?? null, screenshot: input.payment.screenshot ?? null } }, req.user?.uid ?? null);
    // awaited: on serverless (Vercel) work after the response may be frozen and emails lost
    await notify
      .orderPlaced({ orderNumber: order.orderNumber, customer: input.customer, shipping: input.shipping, items: order.items, subtotal: order.subtotal, discount: order.discount, deliveryCharge: order.deliveryCharge, total: order.total, payment: { method: input.payment.method, status: order.paymentStatus } })
      .catch((e) => console.error("order email failed", e));
    res.status(201).json({ orderId: order.orderId, orderNumber: order.orderNumber, total: order.total });
  }),
);

publicRouter.post(
  "/coupons/validate",
  strictLimiter,
  ah(async (req, res) => {
    const { code, subtotal } = parse(z.object({ code: str(1, 40), subtotal: z.number().min(0) }), req.body);
    const snap = await db().doc(`coupons/${code.toUpperCase()}`).get();
    const c = validateCoupon(snap.exists ? (snap.data() as Coupon) : undefined, subtotal);
    res.json({ coupon: { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount } });
  }),
);

publicRouter.post(
  "/contact",
  strictLimiter,
  ah(async (req, res) => {
    const v = parse(z.object({ name: str(2, 80), email: z.string().email(), phone: z.string().max(20).optional(), subject: str(3, 120), message: str(10, 2000) }), req.body);
    await db().collection("messages").add({ ...v, read: false, repliedAt: null, createdAt: FieldValue.serverTimestamp() });
    await notify.contactMessage(v).catch((e) => console.error("contact email failed", e));
    res.status(201).json({ ok: true });
  }),
);

publicRouter.post(
  "/newsletter",
  strictLimiter,
  ah(async (req, res) => {
    const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email() }), req.body);
    await db().doc(`subscribers/${email}`).set({ email, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    res.status(201).json({ ok: true });
  }),
);

/** Only customers with a delivered order containing the product can review it. */
publicRouter.post(
  "/reviews",
  strictLimiter,
  requireAuth,
  ah(async (req, res) => {
    const v = parse(z.object({ productId: str(1, 64), rating: z.number().int().min(1).max(5), title: str(3, 80), body: str(10, 1000) }), req.body);
    const orders = await db().collection("orders").where("userId", "==", req.user!.uid).where("status", "==", "delivered").get();
    const verified = orders.docs.some((d) => (d.data().items as { productId: string }[]).some((i) => i.productId === v.productId));
    if (!verified) throw new HttpError(403, "You can review this item after it has been delivered to you.");
    const existing = await db().collection("reviews").where("userId", "==", req.user!.uid).where("productId", "==", v.productId).limit(1).get();
    if (!existing.empty) throw new HttpError(409, "You've already reviewed this product.");
    const user = await db().doc(`users/${req.user!.uid}`).get();
    await db().collection("reviews").add({ ...v, userId: req.user!.uid, userName: user.data()?.name ?? req.user!.name ?? "Customer", verified: true, status: "pending", createdAt: FieldValue.serverTimestamp() });
    res.status(201).json({ ok: true });
  }),
);

/** Cloudinary signature. Payment screenshots: anyone (rate-limited). Other folders: staff only. */
publicRouter.post(
  "/uploads/sign",
  uploadLimiter,
  ah(async (req, res, next) => {
    const { folder } = parse(z.object({ folder: z.enum(["products", "categories", "banners", "branding", "payments"]) }), req.body);
    if (folder === "payments") return res.json(signUpload("payments"));
    await requireStaff(req, res, (err?: unknown) => (err ? next(err) : res.json(signUpload(folder))));
  }),
);
