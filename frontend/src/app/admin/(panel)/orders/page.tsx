"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FilterX, ShoppingBag } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, AInput, ASelect, Card, EmptyBlock, PageHeader, Pager, PaymentBadge, SearchBox, Segmented, StatusBadge, Table, TableSkeleton, timeAgo, usePaged } from "@/components/admin/ui";
import { exportCSV } from "@/lib/admin/export";
import { ORDER_STATUSES, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

function OrdersView() {
  const sp = useSearchParams();
  const router = useRouter();
  const { orders } = useAdminData();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState<OrderStatus | "all">((sp.get("status") as OrderStatus) ?? "all");
  const [method, setMethod] = useState("all");
  const [pay, setPay] = useState(sp.get("payment") ?? "all");
  const [city, setCity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const cities = useMemo(() => [...new Set((orders ?? []).map((o) => o.shipping.city))].sort(), [orders]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    for (const o of orders ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const f = from ? new Date(from + "T00:00:00").getTime() : 0;
    const t = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return (orders ?? []).filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (method === "all" || o.payment.method === method) &&
        (pay === "all" || o.payment.status === pay) &&
        (city === "all" || o.shipping.city === city) &&
        o.createdAt >= f &&
        o.createdAt <= t &&
        (!s || o.orderNumber.toLowerCase().includes(s) || o.customer.name.toLowerCase().includes(s) || o.customer.phone.replace(/\s/g, "").includes(s.replace(/\s/g, "")) || o.customer.email.toLowerCase().includes(s) || (o.courier?.trackingNumber ?? "").includes(s)),
    );
  }, [orders, q, status, method, pay, city, from, to]);

  const paged = usePaged(filtered, 25);
  const anyFilter = q || method !== "all" || pay !== "all" || city !== "all" || from || to;

  const clear = () => {
    setQ("");
    setMethod("all");
    setPay("all");
    setCity("all");
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Live — new orders appear instantly with a sound alert."
        actions={
          <AButton
            variant="subtle"
            onClick={() =>
              exportCSV(
                "ah-orders",
                filtered.map((o) => ({ "Order #": o.orderNumber, Date: new Date(o.createdAt).toLocaleString("en-PK"), Customer: o.customer.name, Phone: o.customer.phone, City: o.shipping.city, Total: o.total, Payment: PAYMENT_LABELS[o.payment.method], "Payment status": o.payment.status, Status: STATUS_LABELS[o.status], Tracking: o.courier?.trackingNumber ?? "" })),
              )
            }
            disabled={!filtered.length}
          >
            <Download /> Export
          </AButton>
        }
      />

      <Segmented
        className="mb-4"
        value={status}
        onChange={(v) => {
          setStatus(v);
          paged.setPage(1);
        }}
        options={[{ value: "all" as const, label: <>All <Count n={counts.all} /></> }, ...ORDER_STATUSES.map((s) => ({ value: s, label: <>{STATUS_LABELS[s]} <Count n={counts[s] ?? 0} /></> }))]}
      />

      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.6fr)_repeat(3,minmax(130px,1fr))_auto_auto_auto]">
          <SearchBox value={q} onChange={(v) => { setQ(v); paged.setPage(1); }} placeholder="Order #, name, phone, email, tracking" />
          <ASelect value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method">
            <option value="all">All methods</option>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </ASelect>
          <ASelect value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment status">
            <option value="all">Any payment status</option>
            <option value="awaiting_approval">Needs approval</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="rejected">Rejected</option>
          </ASelect>
          <ASelect value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </ASelect>
          <AInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className="lg:w-[145px]" />
          <AInput type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className="lg:w-[145px]" />
          <AButton variant="ghost" onClick={clear} disabled={!anyFilter} aria-label="Clear filters">
            <FilterX /> <span className="lg:sr-only">Clear</span>
          </AButton>
        </div>

        {!orders ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyBlock icon={ShoppingBag} title={orders.length ? "No orders match these filters" : "No orders yet"} description={orders.length ? "Try clearing some filters." : "When customers place orders they show up here in real time."} action={anyFilter ? <AButton variant="subtle" onClick={clear}>Clear filters</AButton> : undefined} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((o) => (
                  <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className="cursor-pointer transition hover:bg-muted/50">
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-accent" onClick={(e) => e.stopPropagation()}>{o.orderNumber}</Link>
                      <p className="text-xs text-muted-foreground" title={new Date(o.createdAt).toLocaleString("en-PK")}>{timeAgo(o.createdAt)}</p>
                    </td>
                    <td>
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer.phone}</p>
                    </td>
                    <td className="text-muted-foreground">{o.shipping.city}</td>
                    <td className="tabular-nums text-muted-foreground">{o.items.reduce((a, i) => a + i.qty, 0)}</td>
                    <td><PaymentBadge status={o.payment.status} method={o.payment.method} /></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-right font-semibold tabular-nums">{formatPKR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pager {...paged} />
          </>
        )}
      </Card>
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 rounded-full bg-foreground/8 px-1.5 text-[10.5px] tabular-nums">{n}</span>;
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
