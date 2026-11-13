"use client";
import { Suspense, use, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { AdminGuard } from "@/components/admin/guard";
import { useLiveDoc } from "@/lib/admin/live";
import { demo } from "@/lib/admin/demo";
import { DUMMY_SETTINGS } from "@/lib/dummy-data";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";
import type { Order, StoreSettings } from "@/lib/types";

function PrintView({ id }: { id: string }) {
  const type = useSearchParams().get("type") === "slip" ? "slip" : "invoice";
  const order = useLiveDoc<Order>(`orders/${id}`, useCallback(() => demo.orders().find((o) => o.id === id) ?? null, [id]));
  const s = useLiveDoc<StoreSettings>("settings/store", demo.settings) ?? DUMMY_SETTINGS;

  useEffect(() => {
    if (!order) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [order]);

  if (order === undefined) return <p className="p-10 text-center text-sm">Loading…</p>;
  if (order === null) return <p className="p-10 text-center text-sm">Order not found.</p>;
  const slip = type === "slip";
  const date = new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-[#ecebe8] py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[800px] justify-end px-4">
        <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#141414] px-4 text-sm font-semibold text-white">
          <Printer className="size-4" /> Print {slip ? "packing slip" : "invoice"}
        </button>
      </div>
      <article className="mx-auto max-w-[800px] bg-white p-10 text-[13px] leading-relaxed text-[#141414] shadow-sm print:max-w-none print:p-0 print:shadow-none" style={{ fontFamily: "var(--font-manrope), system-ui, sans-serif" }}>
        <header className="flex items-start justify-between border-b-2 border-[#141414] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-[#b08d57] font-display text-lg font-semibold">AH</span>
              <div>
                <p className="font-display text-2xl font-semibold leading-none">{s.storeName}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#b08d57]">{s.tagline || "Pakistan"}</p>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-xs text-[#6b6560]">{s.address}<br />{s.phone} · {s.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-bold uppercase tracking-[0.12em]">{slip ? "Packing slip" : "Invoice"}</p>
            <p className="mt-1 font-semibold">{order.orderNumber}</p>
            <p className="text-xs text-[#6b6560]">{date}</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">{slip ? "Ship to" : "Bill & ship to"}</p>
            <p className={slip ? "text-lg font-bold" : "font-semibold"}>{order.customer.name}</p>
            <p className={slip ? "text-base" : ""}>{order.shipping.address}</p>
            <p className={slip ? "text-base font-bold" : "font-semibold"}>{order.shipping.city}</p>
            <p className="mt-1">{order.customer.phone}</p>
            {!slip && order.customer.email && <p className="text-[#6b6560]">{order.customer.email}</p>}
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">Payment</p>
            <p className="font-semibold">{PAYMENT_LABELS[order.payment.method]}</p>
            <p>{order.payment.status === "paid" ? "PAID" : order.payment.method === "cod" ? `Collect ${formatPKR(order.total)}` : order.payment.status.replace("_", " ")}</p>
            {order.courier && (
              <>
                <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6560]">Courier</p>
                <p>{order.courier.name} · {order.courier.trackingNumber}</p>
              </>
            )}
          </div>
        </section>

        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#141414] text-[10px] uppercase tracking-[0.16em] text-[#6b6560]">
              {slip && <th className="w-8 py-2">✓</th>}
              <th className="py-2">Item</th>
              <th className="py-2">Size</th>
              <th className="py-2">Colour</th>
              <th className="py-2 text-center">Qty</th>
              {!slip && <th className="py-2 text-right">Price</th>}
              {!slip && <th className="py-2 text-right">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-b border-[#e6ded2]">
                {slip && <td className="py-2.5"><span className="inline-block size-4 border border-[#141414]" /></td>}
                <td className="py-2.5 font-medium">{it.name}</td>
                <td className="py-2.5">{it.size}</td>
                <td className="py-2.5">{it.color}</td>
                <td className="py-2.5 text-center font-semibold">{it.qty}</td>
                {!slip && <td className="py-2.5 text-right tabular-nums">{formatPKR(it.unitPrice)}</td>}
                {!slip && <td className="py-2.5 text-right tabular-nums">{formatPKR(it.lineTotal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!slip ? (
          <div className="ml-auto mt-5 w-72 space-y-1.5">
            <p className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPKR(order.subtotal)}</span></p>
            {order.discount > 0 && <p className="flex justify-between"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span className="tabular-nums">−{formatPKR(order.discount)}</span></p>}
            <p className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{order.deliveryCharge ? formatPKR(order.deliveryCharge) : "Free"}</span></p>
            <p className="flex justify-between border-t-2 border-[#141414] pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatPKR(order.total)}</span></p>
          </div>
        ) : (
          <p className="mt-5 text-right text-sm">Total pieces: <b>{order.items.reduce((a, i) => a + i.qty, 0)}</b></p>
        )}

        {order.shipping.notes && <p className="mt-6 border border-dashed border-[#e6ded2] p-3 text-xs"><b>Customer note:</b> {order.shipping.notes}</p>}

        <footer className="mt-12 border-t border-[#e6ded2] pt-4 text-center text-xs text-[#6b6560]">
          Thank you for shopping with {s.storeName}! Exchanges within 7 days — WhatsApp us at {s.whatsapp}.
        </footer>
      </article>
    </div>
  );
}

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminGuard>
      <Suspense>
        <PrintView id={id} />
      </Suspense>
    </AdminGuard>
  );
}
