/**
 * Notifications module. Channels: email (Resend) today; WhatsApp Cloud API can be
 * added by implementing `whatsappChannel.send` — callers don't change.
 */
import { render } from "@react-email/components";
import { Resend } from "resend";
import { createElement } from "react";
import { configured, env } from "../lib/env.js";
import { getSettings } from "../services/orders.js";
import { AdminNewOrderEmail, CustomEmail, OrderPlacedEmail, StatusEmail, type EmailOrder } from "../emails/templates.js";

let resend: Resend | null = null;
const client = () => (configured.resend ? (resend ??= new Resend(env.RESEND_API_KEY)) : null);

export async function sendEmail(to: string | string[], subject: string, element: React.ReactElement, replyTo?: string) {
  const c = client();
  if (!c) {
    console.info(`[email skipped — RESEND_API_KEY missing] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  const html = await render(element);
  const { error } = await c.emails.send({ from: env.EMAIL_FROM, to, subject, html, replyTo });
  if (error) {
    console.error("Resend error", error);
    throw new Error("Email could not be sent.");
  }
  return { sent: true };
}

async function brand() {
  const s = await getSettings();
  return { storeName: s.storeName, siteUrl: env.SITE_URL, phone: s.phone, email: s.email };
}

/** Future: WhatsApp Cloud API. Kept as a no-op so it can be switched on without touching order code. */
export const whatsappChannel = {
  enabled: false,
  async send(_to: string, _text: string) {
    void _to;
    void _text;
  },
};

export const notify = {
  async orderPlaced(order: EmailOrder) {
    const b = await brand();
    const jobs: Promise<unknown>[] = [sendEmail(order.customer.email, `Order ${order.orderNumber} confirmed — ${b.storeName}`, createElement(OrderPlacedEmail, { order, brand: b }), b.email)];
    if (env.ADMIN_NOTIFY_EMAIL) jobs.push(sendEmail(env.ADMIN_NOTIFY_EMAIL, `🛍️ New order ${order.orderNumber}`, createElement(AdminNewOrderEmail, { order, brand: b })));
    await Promise.allSettled(jobs);
  },
  async statusChanged(order: EmailOrder, status: string) {
    if (!["confirmed", "shipped", "delivered", "cancelled", "returned"].includes(status)) return;
    const b = await brand();
    const s = await getSettings();
    const tpl = s.templates?.email?.[status as keyof NonNullable<NonNullable<typeof s.templates>["email"]>];
    const subject = tpl?.subject?.replace("{orderNumber}", order.orderNumber) ?? `Order ${order.orderNumber}: ${status}`;
    await sendEmail(order.customer.email, subject, createElement(StatusEmail, { order, status, brand: b, customText: tpl?.body }), b.email).catch((e) => console.error(e));
  },
  /** New contact-form message → admin inbox email (reply goes straight to the customer). */
  async contactMessage(m: { name: string; email: string; phone?: string; subject: string; message: string }) {
    if (!env.ADMIN_NOTIFY_EMAIL) return;
    const b = await brand();
    const body = `New message from your website contact form.

Name: ${m.name}
Email: ${m.email}
Phone: ${m.phone || "—"}
Subject: ${m.subject}

${m.message}

Reply to this email to answer the customer, or open Admin → Messages.`;
    await sendEmail(env.ADMIN_NOTIFY_EMAIL, `📩 Contact form: ${m.subject}`, createElement(CustomEmail, { name: "Admin", subject: m.subject, message: body, brand: b }), m.email);
  },
  async custom(to: string, name: string, subject: string, message: string) {
    const b = await brand();
    return sendEmail(to, subject, createElement(CustomEmail, { name, subject, message, brand: b }), b.email);
  },
};
