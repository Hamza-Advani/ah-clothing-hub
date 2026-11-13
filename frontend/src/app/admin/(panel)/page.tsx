"use client";
import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Banknote, Boxes, CircleDollarSign, Clock, Coins, PackageX, Receipt, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useMounted } from "@/hooks/use-mounted";
import { useAdminData } from "@/components/admin/admin-data";
import { Card, CardHeader, PageHeader, StatCard, StatusBadge, Table, TableSkeleton, Thumb, timeAgo, AButton, EmptyBlock } from "@/components/admin/ui";
import { RangePicker, useRangeState } from "@/components/admin/range-picker";
import { Donut, SERIES, TrendArea } from "@/components/admin/charts";
import { breakdowns, getRange, metrics, pctChange, timeSeries } from "@/lib/admin/analytics";
import { useCounted, useCustomers } from "@/lib/admin/hooks";
import { formatPKR } from "@/lib/utils";

const LOW_STOCK = 5;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const mounted = useMounted();
  const { orders, priv, products, settings, ordersError } = useAdminData();
  const { data: customers } = useCustomers();
  const rs = useRangeState("7d");
  const { range } = rs;
  const counted = useCounted(settings.profitCountsStatuses);

  const d = useMemo(() => {
    if (!orders) return null;
    const cur = metrics(orders, priv, counted, customers, range.start, range.end);
    const prev = metrics(orders, priv, counted, customers, range.prevStart, range.prevEnd);
    const today = getRange("today");
    const t = metrics(orders, priv, counted, customers, today.start, today.end);
    const all = metrics(orders, priv, counted, customers, 0, Infinity);
    return { cur, prev, t, all, series: timeSeries(orders, priv, counted, customers, range), br: breakdowns(orders, products ?? [], range) };
  }, [orders, priv, counted, customers, range, products]);

  const lowStock = useMemo(() => (products ?? []).filter((p) => p.totalStock <= LOW_STOCK).sort((a, b) => a.totalStock - b.totalStock), [products]);
  const pending = orders?.filter((o) => o.status === "pending").length ?? 0;
  const awaiting = orders?.filter((o) => o.payment.status === "awaiting_approval").length ?? 0;

  return (
    <>
      <PageHeader
        title={`${mounted ? greeting() : "Welcome"}, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's what is happening in your store. Data updates live."
        actions={<RangePicker state={rs} />}
      />

      {ordersError && (
        <Card className="mb-6 flex items-center gap-3 border-sale/40 p-4 text-sm text-sale">
          <AlertTriangle className="size-5 shrink-0" /> {ordersError}
        </Card>
      )}

      {/* Today at a glance */}
      <Card className="mb-6 grid grid-cols-2 divide-border overflow-hidden bg-[#13211d] text-[#f2efea] sm:grid-cols-4 sm:divide-x sm:divide-white/10">
        {[
          { label: "Today's orders", value: d ? String(d.t.orders) : "—", icon: ShoppingBag },
          { label: "Today's sales", value: d ? formatPKR(d.t.sales) : "—", icon: Banknote },
          { label: "Today's profit", value: d ? formatPKR(d.t.profit) : "—", icon: Coins },
          { label: "Needs attention", value: `${pending} pending · ${awaiting} payments`, icon: Clock, href: "/admin/orders?status=pending" },
        ].map((x) => (
          <div key={x.label} className="p-4 md:p-5">
            <p className="flex items-center gap-2 text-[12px] font-medium text-[#c9c2b8]">
              <x.icon className="size-3.5 text-[#c9a46a]" /> {x.label}
              {x.label === "Today's orders" && <span className="relative ml-1 flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4fb386] opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-[#4fb386]" /></span>}
            </p>
            {x.href ? (
              <Link href={x.href} className="mt-1.5 block truncate text-[15px] font-bold hover:underline md:text-[17px]">{x.value}</Link>
            ) : (
              <p className="mt-1.5 truncate text-[20px] font-bold tabular-nums md:text-[22px]">{x.value}</p>
            )}
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard label={`Orders · ${range.label}`} icon={ShoppingBag} value={d ? d.cur.orders.toLocaleString() : "—"} delta={d ? pctChange(d.cur.orders, d.prev.orders) : undefined} hint="vs previous period" />
        <StatCard label={`Sales · ${range.label}`} icon={Banknote} value={d ? formatPKR(d.cur.sales) : "—"} delta={d ? pctChange(d.cur.sales, d.prev.sales) : undefined} hint="vs previous period" />
        <StatCard label={`Profit · ${range.label}`} icon={TrendingUp} value={d ? formatPKR(d.cur.profit) : "—"} delta={d ? pctChange(d.cur.profit, d.prev.profit) : undefined} hint="counted orders" />
        <StatCard label="Avg. order value" icon={Receipt} value={d ? formatPKR(d.cur.aov) : "—"} delta={d ? pctChange(d.cur.aov, d.prev.aov) : undefined} hint="vs previous period" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sales over time" description={`Order value (excl. cancelled) · ${range.label}`} action={<Link href="/admin/analytics" className="text-xs font-semibold text-accent hover:underline">Full analytics</Link>} />
          <div className="px-2 pb-3 pt-4">{d ? <TrendArea data={d.series} dataKey="sales" name="Sales" /> : <div className="skeleton mx-3 h-[260px] rounded-lg" />}</div>
        </Card>
        <Card>
          <CardHeader title="Orders by status" description={range.label} />
          <div className="p-5">{d ? <Donut data={d.br.status} center={{ label: "orders", value: String(d.br.status.reduce((a, s) => a + s.value, 0)) }} /> : <div className="skeleton h-[220px] rounded-lg" />}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Recent orders <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-success">Live</span>
              </span>
            }
            action={
              <AButton variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">
                  View all <ArrowRight />
                </Link>
              </AButton>
            }
          />
          <div className="mt-3">
            {!orders ? (
              <TableSkeleton rows={5} />
            ) : orders.length === 0 ? (
              <EmptyBlock icon={ShoppingBag} title="No orders yet" description="New orders will appear here instantly, with a sound alert." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="transition hover:bg-muted/50">
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-accent">{o.orderNumber}</Link>
                        <p className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</p>
                      </td>
                      <td>
                        <p className="font-medium">{o.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{o.shipping.city}</p>
                      </td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-right font-semibold tabular-nums">{formatPKR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Stock alerts" description={`Products with ${LOW_STOCK} or fewer pieces left`} action={<Link href="/admin/products?stock=low" className="text-xs font-semibold text-accent hover:underline">Manage</Link>} />
          <ul className="mt-3 max-h-[420px] divide-y divide-border overflow-y-auto">
            {!products && <li className="p-5"><div className="skeleton h-24 rounded-lg" /></li>}
            {products && lowStock.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted-foreground">All products are well stocked 🎉</li>}
            {lowStock.slice(0, 12).map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/50">
                  <Thumb src={p.images[0]?.url} alt={p.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.sku || p.categorySlug}</span>
                  </span>
                  {p.totalStock === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-bold text-sale"><PackageX className="size-3" /> Out</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-2 py-0.5 text-[11px] font-bold text-warning"><AlertTriangle className="size-3" /> {p.totalStock} left</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold">All-time overview</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-6">
        <StatCard label="Total revenue" icon={CircleDollarSign} value={d ? formatPKR(d.all.revenue) : "—"} hint="counted orders" />
        <StatCard label="Total profit" icon={Wallet} value={d ? formatPKR(d.all.profit) : "—"} hint={d && d.all.revenue ? `${Math.round((d.all.profit / d.all.revenue) * 100)}% margin` : undefined} />
        <StatCard label="Total orders" icon={ShoppingBag} value={orders ? orders.length.toLocaleString() : "—"} />
        <StatCard label="Pending orders" icon={Clock} value={pending} tone={pending ? "warning" : "default"} />
        <StatCard label="Customers" icon={Users} value={customers ? customers.length.toLocaleString() : "—"} hint={d ? `+${d.cur.newCustomers} in range` : undefined} />
        <StatCard label="Low / out of stock" icon={Boxes} value={products ? lowStock.length : "—"} tone={lowStock.length ? "danger" : "default"} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Profit counts orders with status: {counted.join(", ")} (change in Settings → Delivery & payments). <span style={{ color: SERIES[0] }}>●</span> Sales include all non-cancelled orders.
      </p>
    </>
  );
}
