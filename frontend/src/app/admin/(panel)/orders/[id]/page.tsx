"use client";
import Link from "next/link";
import { use, useCallback, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, FileText, Mail, MapPin, MessageCircle, Package, Phone, Printer, Truck, User, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, AField, AInput, ASelect, ATextarea, Card, CardHeader, dateTime, EmptyBlock, FullLoader, PageHeader, PaymentBadge, StatusBadge, Thumb } from "@/components/admin/ui";
import { EmailDialog, WhatsAppDialog } from "@/components/admin/comm-dialogs";
import { Modal } from "@/components/ui/radix";
import { Checkbox } from "@/components/ui/radix";
import { useLiveDoc } from "@/lib/admin/live";
import { demo, type PrivateDoc } from "@/lib/admin/demo";
import { adminApi, run } from "@/lib/admin/actions";
import { DEFAULT_WHATSAPP_TEMPLATES, fillTemplate } from "@/lib/admin/templates";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { cn, formatPKR } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
const COURIERS = ["TCS", "Leopards", "M&P", "Trax", "PostEx", "Call Courier", "BlueEx", "Pakistan Post", "Other"];

function nextOptions(cur: OrderStatus): OrderStatus[] {
  if (cur === "cancelled" || cur === "returned") return [];
  const i = FLOW.indexOf(cur);
  const fwd = FLOW.slice(i + 1);
  const extra: OrderStatus[] = cur === "shipped" || cur === "delivered" ? ["returned"] : [];
  return [...fwd, ...(cur === "delivered" ? [] : (["cancelled"] as OrderStatus[])), ...extra];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useAdminData();
  const order = useLiveDoc<Order>(`orders/${id}`, useCallback(() => demo.orders().find((o) => o.id === id) ?? null, [id]));
  const priv = useLiveDoc<PrivateDoc>(`ordersPrivate/${id}`, useCallback(() => demo.ordersPrivate().find((o) => o.id === id) ?? null, [id]));
  const [email, setEmail] = useState(false);
  const [wa, setWa] = useState(false);
  const [shot, setShot] = useState(false);

  if (order === undefined) return <FullLoader label="Loading order…" />;
  if (order === null)
    return <EmptyBlock icon={Package} title="Order not found" description="It may have been removed." action={<AButton asChild variant="subtle"><Link href="/admin/orders">Back to orders</Link></AButton>} />;

  const waTpl = settings.templates?.whatsapp?.[order.status] || DEFAULT_WHATSAPP_TEMPLATES[order.status];
  const emailTpl = settings.templates?.email?.[order.status];
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast.success("Copied"));
  const itemsCount = order.items.reduce((a, i) => a + i.qty, 0);

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Orders
          </Link>
        }
        title={`Order ${order.orderNumber}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {dateTime(order.createdAt)} <StatusBadge status={order.status} /> <PaymentBadge status={order.payment.status} />
          </span>
        }
        actions={
          <>
            <AButton variant="subtle" onClick={() => setWa(true)}>
              <MessageCircle /> WhatsApp
            </AButton>
            <AButton variant="subtle" onClick={() => setEmail(true)} disabled={!order.customer.email}>
              <Mail /> Email
            </AButton>
            <AButton variant="subtle" asChild>
              <a href={`/admin/print/${order.id}?type=invoice`} target="_blank" rel="noreferrer">
                <Printer /> Invoice
              </a>
            </AButton>
            <AButton variant="subtle" asChild>
              <a href={`/admin/print/${order.id}?type=slip`} target="_blank" rel="noreferrer">
                <FileText /> Packing slip
              </a>
            </AButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {/* Items */}
          <Card>
            <CardHeader title={`Items (${itemsCount})`} />
            <ul className="mt-3 divide-y divide-border">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Thumb src={it.image} alt={it.name} className="size-16" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${it.slug}`} target="_blank" className="font-semibold hover:text-accent">{it.name}</Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Size <b className="text-foreground">{it.size}</b> · Colour <b className="text-foreground">{it.color}</b> · Qty <b className="text-foreground">{it.qty}</b>
                    </p>
                    {it.discount > 0 && <p className="text-xs text-success">Coupon share −{formatPKR(it.discount)}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold tabular-nums">{formatPKR(it.lineTotal)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatPKR(it.unitPrice)} × {it.qty}
                      {it.price > it.unitPrice && <span className="ml-1 line-through">{formatPKR(it.price)}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
              <Row k="Subtotal" v={formatPKR(order.subtotal)} />
              {order.discount > 0 && <Row k={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} v={`−${formatPKR(order.discount)}`} className="text-success" />}
              <Row k="Delivery" v={order.deliveryCharge ? formatPKR(order.deliveryCharge) : "Free"} />
              <Row k="Total" v={formatPKR(order.total)} className="pt-1 text-base font-bold" />
            </dl>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><User className="size-4 text-accent" /> Customer</h3>
              <p className="font-semibold">{order.customer.name}</p>
              <p className="mt-2 flex items-center gap-2 text-sm"><Phone className="size-3.5 text-muted-foreground" /> <a href={`tel:${order.customer.phone}`} className="hover:underline">{order.customer.phone}</a> <CopyBtn onClick={() => copy(order.customer.phone)} /></p>
              {order.customer.email && <p className="mt-1 flex items-center gap-2 break-all text-sm"><Mail className="size-3.5 shrink-0 text-muted-foreground" /> {order.customer.email}</p>}
              {order.userId ? (
                <Link href={`/admin/customers/${order.userId}`} className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline">View customer profile →</Link>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Guest checkout</p>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><MapPin className="size-4 text-accent" /> Shipping address</h3>
              <p className="text-sm leading-relaxed">{order.shipping.address}</p>
              <p className="mt-1 text-sm font-semibold">{order.shipping.city}</p>
              {order.shipping.notes && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs"><b>Note:</b> {order.shipping.notes}</p>}
              <AButton size="sm" variant="ghost" className="-ml-2 mt-2" onClick={() => copy(`${order.customer.name}\n${order.customer.phone}\n${order.shipping.address}\n${order.shipping.city}`)}>
                <Copy /> Copy address
              </AButton>
            </Card>
          </div>

          <PaymentCard order={order} onViewShot={() => setShot(true)} />
        </div>

        <div className="space-y-4">
          <StatusCard order={order} />
          <CourierCard order={order} />
          {priv && (
            <Card className="p-5">
              <h3 className="mb-3 text-[15px] font-semibold">Profit <span className="text-xs font-normal text-muted-foreground">(admin only)</span></h3>
              <dl className="space-y-1.5 text-sm">
                <Row k="Revenue (after discount)" v={formatPKR(priv.revenue)} />
                <Row k="Cost of goods" v={`−${formatPKR(priv.cost)}`} />
                <Row k="Profit" v={formatPKR(priv.profit)} className={cn("pt-1 font-bold", priv.profit >= 0 ? "text-success" : "text-sale")} />
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">Margin {priv.revenue ? Math.round((priv.profit / priv.revenue) * 100) : 0}% · delivery charges excluded</p>
            </Card>
          )}
          <Card className="p-5">
            <h3 className="mb-4 text-[15px] font-semibold">Timeline</h3>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[26px] top-1 grid size-3 place-items-center rounded-full ring-4 ring-surface", i === 0 ? "bg-accent" : "bg-border")} />
                  <p className="text-sm font-semibold">{STATUS_LABELS[h.status]}</p>
                  <p className="text-xs text-muted-foreground">{dateTime(h.at)}{h.by === "customer" ? " · by customer" : ""}</p>
                  {h.note && <p className="mt-1 text-xs">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <EmailDialog
        open={email}
        onOpenChange={setEmail}
        to={order.customer.email}
        name={order.customer.name}
        subject={emailTpl?.subject ? fillTemplate(emailTpl.subject, order) : `About your order ${order.orderNumber}`}
        message={emailTpl?.body ? fillTemplate(emailTpl.body, order) : `Hi ${order.customer.name.split(" ")[0]},\n\n`}
      />
      <WhatsAppDialog open={wa} onOpenChange={setWa} phone={order.customer.phone} name={order.customer.name} text={fillTemplate(waTpl, order)} />
      {order.payment.screenshot && (
        <Modal open={shot} onOpenChange={setShot} title="Payment screenshot" description={`${PAYMENT_LABELS[order.payment.method]}${order.payment.txnId ? ` · TID ${order.payment.txnId}` : ""}`} className="max-w-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.payment.screenshot.url} alt="Payment screenshot" className="max-h-[70vh] w-full rounded-lg object-contain" />
          <a href={order.payment.screenshot.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
            Open full size <ExternalLink className="size-3" />
          </a>
        </Modal>
      )}
    </>
  );
}

function Row({ k, v, className }: { k: string; v: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-4", className)}>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function CopyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-muted-foreground hover:text-foreground" aria-label="Copy">
      <Copy className="size-3.5" />
    </button>
  );
}

function PaymentCard({ order, onViewShot }: { order: Order; onViewShot: () => void }) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const manual = order.payment.method !== "cod";
  const decide = async (d: "approve" | "reject") => {
    setBusy(d);
    await run(adminApi.orderPayment(order.id, d, note || undefined), d === "approve" ? "Payment approved — order confirmed" : "Payment rejected");
    setBusy(null);
  };
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Payment</h3>
          <p className="mt-1 text-sm">{PAYMENT_LABELS[order.payment.method]}</p>
          {order.payment.txnId && <p className="mt-0.5 text-xs text-muted-foreground">Transaction ID: <b className="text-foreground">{order.payment.txnId}</b></p>}
        </div>
        <PaymentBadge status={order.payment.status} />
      </div>
      {manual && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          {order.payment.screenshot ? (
            <button onClick={onViewShot} className="group relative h-40 w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.payment.screenshot.url} alt="Payment screenshot" className="size-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <ZoomIn className="size-6" />
              </span>
            </button>
          ) : (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">No screenshot uploaded.</p>
          )}
          {order.payment.status === "awaiting_approval" || order.payment.status === "rejected" ? (
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">Check your {PAYMENT_LABELS[order.payment.method]} account for <b className="text-foreground">{formatPKR(order.total)}</b>, then approve or reject.</p>
              <AInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
              <div className="flex gap-2">
                <AButton className="bg-success text-white hover:bg-success/90" onClick={() => decide("approve")} loading={busy === "approve"} disabled={!!busy}>
                  <Check /> Approve
                </AButton>
                <AButton variant="subtle" className="text-sale" onClick={() => decide("reject")} loading={busy === "reject"} disabled={!!busy || order.payment.status === "rejected"}>
                  <X /> Reject
                </AButton>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{order.payment.status === "paid" ? "Payment verified ✓" : "Waiting for payment."}</p>
          )}
        </div>
      )}
      {!manual && <p className="mt-3 text-xs text-muted-foreground">Cash is collected by the courier on delivery. Marked paid automatically when delivered.</p>}
    </Card>
  );
}

function StatusCard({ order }: { order: Order }) {
  const options = nextOptions(order.status);
  const [status, setStatus] = useState<OrderStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [courier, setCourier] = useState(order.courier?.name ?? "TCS");
  const [tracking, setTracking] = useState(order.courier?.trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const sel = options.includes(status as OrderStatus) ? (status as OrderStatus) : options[0];
  const needsCourier = sel === "shipped" && !order.courier;

  const save = async () => {
    if (!sel) return;
    if (needsCourier && !tracking.trim()) return toast.error("Add the tracking number before marking as shipped");
    setBusy(true);
    const ok = await run(
      adminApi.orderStatus(order.id, { status: sel, note: note || undefined, notify, courier: sel === "shipped" && tracking.trim() ? { name: courier, trackingNumber: tracking.trim() } : undefined }),
      `Order marked ${STATUS_LABELS[sel].toLowerCase()}${notify ? " · customer notified" : ""}`,
    );
    setBusy(false);
    if (ok) setNote("");
  };

  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-semibold">Update status</h3>
      {/* progress */}
      <div className="mt-4 flex items-center gap-1">
        {FLOW.map((s, i) => {
          const reached = FLOW.indexOf(order.status) >= i && order.status !== "cancelled" && order.status !== "returned";
          return <span key={s} title={STATUS_LABELS[s]} className={cn("h-1.5 flex-1 rounded-full", reached ? "bg-emerald" : "bg-border")} />;
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Current: <b className="text-foreground">{STATUS_LABELS[order.status]}</b></p>
      {options.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">This order is closed.{order.status !== "delivered" ? " Stock was restored." : ""}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <AField label="Move to">
            <ASelect value={sel} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {options.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </ASelect>
          </AField>
          {sel === "shipped" && (
            <div className="grid grid-cols-2 gap-2">
              <AField label="Courier">
                <ASelect value={courier} onChange={(e) => setCourier(e.target.value)}>
                  {COURIERS.map((c) => <option key={c}>{c}</option>)}
                </ASelect>
              </AField>
              <AField label="Tracking #">
                <AInput value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 7712345678" />
              </AField>
            </div>
          )}
          {(sel === "cancelled" || sel === "returned") && <p className="rounded-lg bg-warning/12 px-3 py-2 text-xs text-warning">Stock for these items will be added back automatically.</p>}
          <ATextarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" className="min-h-16" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} /> Email the customer about this update
          </label>
          <AButton className="w-full" onClick={save} loading={busy} variant={sel === "cancelled" ? "destructive" : "primary"}>
            Mark as {sel ? STATUS_LABELS[sel] : ""}
          </AButton>
        </div>
      )}
    </Card>
  );
}

function CourierCard({ order }: { order: Order }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(order.courier?.name ?? "TCS");
  const [tn, setTn] = useState(order.courier?.trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const ok = await run(adminApi.orderCourier(order.id, { name, trackingNumber: tn.trim() }), "Courier details saved");
    setBusy(false);
    if (ok) setEdit(false);
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Truck className="size-4 text-accent" /> Courier</h3>
        {!edit && <button onClick={() => setEdit(true)} className="text-xs font-semibold text-accent hover:underline">{order.courier ? "Edit" : "Add"}</button>}
      </div>
      {edit ? (
        <div className="mt-3 space-y-2">
          <ASelect value={name} onChange={(e) => setName(e.target.value)}>
            {COURIERS.map((c) => <option key={c}>{c}</option>)}
          </ASelect>
          <AInput value={tn} onChange={(e) => setTn(e.target.value)} placeholder="Tracking number" />
          <div className="flex gap-2">
            <AButton size="sm" onClick={save} loading={busy} disabled={!tn.trim()}>Save</AButton>
            <AButton size="sm" variant="ghost" onClick={() => setEdit(false)}>Cancel</AButton>
          </div>
        </div>
      ) : order.courier ? (
        <p className="mt-2 text-sm">
          {order.courier.name} · <b className="tabular-nums">{order.courier.trackingNumber}</b>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Not shipped yet.</p>
      )}
    </Card>
  );
}
