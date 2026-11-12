"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { OrderStatusBadge } from "@/components/store/order-timeline";
import { useMyOrders } from "@/hooks/use-my-orders";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatDate, formatPKR } from "@/lib/utils";

export default function MyOrdersPage() {
  const orders = useMyOrders();
  return (
    <div>
      <h2 className="mb-6 font-display text-3xl">My orders</h2>
      {orders === null ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-36 rounded-[6px]" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="When you place an order, you can track it live right here." action={<Button asChild><Link href="/shop">Start shopping</Link></Button>} />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="group block rounded-[6px] border border-border bg-surface p-5 transition hover:border-foreground/30 hover:shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">Placed {formatDate(o.createdAt)} · {PAYMENT_LABELS[o.payment.method]}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 4).map((it, k) => (
                      <div key={k} className="relative h-16 w-12 overflow-hidden rounded-[4px] border-2 border-surface bg-muted"><Image src={it.image} alt={it.name} fill sizes="48px" className="object-cover" /></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                    {formatPKR(o.total)} <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
