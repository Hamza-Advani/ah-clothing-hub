import { Ban, Check, CircleDot, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
  returned: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]} shape="pill">{STATUS_LABELS[status]}</Badge>;
}

const FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
const ICON = { pending: CircleDot, confirmed: Check, packed: PackageCheck, shipped: Truck, delivered: Check, cancelled: Ban, returned: RotateCcw } as const;
const COPY: Record<OrderStatus, string> = {
  pending: "Order placed — awaiting confirmation",
  confirmed: "Order confirmed by our team",
  packed: "Packed with care at our studio",
  shipped: "Handed to courier & on the way",
  delivered: "Delivered — enjoy!",
  cancelled: "Order cancelled",
  returned: "Order returned",
};

export function OrderTimeline({ order }: { order: Order }) {
  const terminal = order.status === "cancelled" || order.status === "returned";
  const steps: OrderStatus[] = terminal ? [...(order.statusHistory.map((h) => h.status).filter((s) => FLOW.includes(s)) as OrderStatus[]), order.status] : FLOW;
  const reached = new Map(order.statusHistory.map((h) => [h.status, h.at]));
  const currentIdx = steps.indexOf(order.status);

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const done = i <= currentIdx;
        const I = ICON[s];
        const at = reached.get(s);
        return (
          <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
            {i < steps.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-32px)] w-px", i < currentIdx ? "bg-success" : "bg-border")} aria-hidden />}
            <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 transition", done ? (s === "cancelled" ? "border-sale bg-sale text-white" : "border-success bg-success text-white") : "border-border bg-surface text-muted-foreground", i === currentIdx && !terminal && s !== "delivered" && "ring-4 ring-success/20")}>
              <I className="size-3.5" strokeWidth={2.5} />
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>{STATUS_LABELS[s]}</p>
              <p className="text-xs text-muted-foreground">{done ? COPY[s] : "Pending"}</p>
              {at && <time className="mt-0.5 block text-[11px] text-muted-foreground">{new Date(at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</time>}
              {s === "shipped" && done && order.courier && (
                <p className="mt-2 inline-flex rounded-[4px] bg-muted px-3 py-1.5 text-xs">
                  {order.courier.name} · Tracking <strong className="ml-1 tabular-nums">{order.courier.trackingNumber}</strong>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
