"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { motion } from "framer-motion";
import { Check, Copy, MessageCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TotalsRows } from "@/components/store/order-summary";
import { useStoreData } from "@/components/providers/store-data";
import { useAuth } from "@/components/providers/auth-provider";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatPKR, whatsappLink } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

type LastOrder = {
  orderNumber: string;
  customer: { name: string; phone: string; email: string };
  shipping: { address: string; city: string };
  payment: { method: string };
  items: CartItem[];
  totals: { subtotal: number; discount: number; delivery: number; total: number };
  demo?: boolean;
};

export default function OrderSuccessPage() {
  const ready = useMounted();
  const order = useMemo<LastOrder | null>(() => {
    if (!ready) return null;
    try {
      return JSON.parse(sessionStorage.getItem("ah-last-order") || "null");
    } catch {
      return null;
    }
  }, [ready]);
  const { settings } = useStoreData();
  const { user } = useAuth();

  if (!ready) return <div className="min-h-[70vh]" />;
  if (!order)
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-4xl">No recent order found</h1>
        <p className="mt-2 text-muted-foreground">Check “My Orders” in your account for your order history.</p>
        <Button asChild className="mt-6"><Link href="/account/orders">My orders</Link></Button>
      </div>
    );

  const manual = order.payment.method !== "cod";

  return (
    <div className="container-x max-w-3xl py-12 md:py-20">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-success text-white">
          <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}><Check className="size-9" strokeWidth={2.5} /></motion.span>
        </motion.div>
        <p className="eyebrow mt-8 text-accent">Thank you, {order.customer.name.split(" ")[0]}</p>
        <h1 className="mt-3 text-[40px] font-medium leading-none md:text-[56px]">Your order is placed!</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {manual ? "We've received your payment screenshot. Our team will verify it and confirm your order shortly." : "We'll call or WhatsApp you to confirm, then dispatch within 24 hours."} A confirmation has been sent to <strong className="text-foreground">{order.customer.email}</strong>.
        </p>
        <button onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success("Order number copied"); }} className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Order no.</span>
          <span className="font-semibold tabular-nums">{order.orderNumber}</span>
          <Copy className="size-3.5 text-muted-foreground" />
        </button>
        {order.demo && <p className="mt-3 text-xs text-warning">Demo mode — connect the backend to save real orders.</p>}
      </div>

      <div className="mt-12 grid gap-6 rounded-[6px] border border-border bg-surface p-6 md:grid-cols-2 md:p-8">
        <div className="space-y-4 text-sm">
          <div><p className="eyebrow mb-1 text-muted-foreground">Deliver to</p><p className="font-semibold">{order.customer.name}</p><p className="text-muted-foreground">{order.shipping.address}, {order.shipping.city}</p><p className="text-muted-foreground">{order.customer.phone}</p></div>
          <div><p className="eyebrow mb-1 text-muted-foreground">Payment</p><p className="font-semibold">{PAYMENT_LABELS[order.payment.method]}</p>{manual && <p className="text-xs text-warning">Awaiting verification</p>}</div>
          <div><p className="eyebrow mb-1 text-muted-foreground">Estimated delivery</p><p className="font-semibold">2–4 working days</p></div>
        </div>
        <div>
          <ul className="mb-5 space-y-3">
            {order.items.map((i) => (
              <li key={i.key} className="flex items-center gap-3 text-sm">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[3px] bg-muted"><Image src={i.image} alt={i.name} fill sizes="44px" className="object-cover" /></div>
                <span className="min-w-0 flex-1"><span className="line-clamp-1 font-medium">{i.name}</span><span className="text-xs text-muted-foreground">{i.size} · {i.color} · ×{i.qty}</span></span>
                <span className="tabular-nums">{formatPKR((i.salePrice ?? i.price) * i.qty)}</span>
              </li>
            ))}
          </ul>
          <TotalsRows {...order.totals} freeDeliveryThreshold={settings.freeDeliveryThreshold} />
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {user ? <Button asChild size="lg"><Link href="/account/orders"><Package /> Track my order</Link></Button> : <Button asChild size="lg"><Link href="/signup">Create account to track orders</Link></Button>}
        <Button asChild size="lg" variant="outline">
          <a href={whatsappLink(settings.whatsapp, `Hi! I just placed order ${order.orderNumber}.`)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp us</a>
        </Button>
        <Button asChild size="lg" variant="ghost"><Link href="/shop">Continue shopping</Link></Button>
      </div>
    </div>
  );
}
