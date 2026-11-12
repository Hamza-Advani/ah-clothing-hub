"use client";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, OrderTimeline } from "@/components/store/order-timeline";
import { TotalsRows } from "@/components/store/order-summary";
import { useMyOrder } from "@/hooks/use-my-orders";
import { useStoreData } from "@/components/providers/store-data";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatDate, formatPKR, whatsappLink } from "@/lib/utils";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = useMyOrder(id);
  const { settings } = useStoreData();

  if (order === undefined) return <div className="skeleton h-96 rounded-[6px]" />;
  if (order === null)
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/account/orders">Back to orders</Link></Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt, { dateStyle: "long" })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-[6px] border border-border bg-surface p-6">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-[0.14em]">Live tracking</h3>
            <OrderTimeline order={order} />
          </section>
          <section className="rounded-[6px] border border-border bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em]">Items</h3>
            <ul className="divide-y divide-border">
              {order.items.map((it, k) => (
                <li key={k} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <Link href={`/product/${it.slug}`} className="relative h-20 w-15 shrink-0 overflow-hidden rounded-[4px] bg-muted"><Image src={it.image} alt={it.name} fill sizes="60px" className="object-cover" /></Link>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/product/${it.slug}`} className="line-clamp-1 font-semibold hover:text-accent">{it.name}</Link>
                    <p className="text-xs text-muted-foreground">{it.color} · {it.size} · Qty {it.qty}</p>
                    {order.status === "delivered" && <Link href={`/product/${it.slug}#reviews`} className="mt-1 inline-block text-xs font-semibold text-accent underline-offset-4 hover:underline">Write a review</Link>}
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatPKR(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-[6px] border border-border bg-surface p-6">
            <TotalsRows subtotal={order.subtotal} discount={order.discount} delivery={order.deliveryCharge} total={order.total} freeDeliveryThreshold={settings.freeDeliveryThreshold} />
          </section>
          <section className="space-y-4 rounded-[6px] border border-border bg-surface p-6 text-sm">
            <div><p className="eyebrow mb-1 text-muted-foreground">Delivery address</p><p className="font-semibold">{order.customer.name}</p><p className="text-muted-foreground">{order.shipping.address}, {order.shipping.city}</p><p className="text-muted-foreground">{order.customer.phone}</p></div>
            <div><p className="eyebrow mb-1 text-muted-foreground">Payment</p><p className="font-semibold">{PAYMENT_LABELS[order.payment.method]}</p><p className="text-xs capitalize text-muted-foreground">{order.payment.status.replace("_", " ")}</p></div>
          </section>
          <Button asChild variant="outline" className="w-full">
            <a href={whatsappLink(settings.whatsapp, `Hi! I have a question about my order ${order.orderNumber}.`)} target="_blank" rel="noreferrer"><MessageCircle /> Need help? WhatsApp us</a>
          </Button>
        </aside>
      </div>
    </div>
  );
}
