"use client";
import { useMemo } from "react";
import { Banknote, Download, FileSpreadsheet, Receipt, ShoppingBag, TrendingUp, UserPlus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, Card, CardHeader, PageHeader, StatCard } from "@/components/admin/ui";
import { RangePicker, useRangeState } from "@/components/admin/range-picker";
import { Donut, GroupedBars, HorizontalBars, Legend, SERIES, TrendArea, TrendLine } from "@/components/admin/charts";
import { breakdowns, isClosed, metrics, pctChange, timeSeries } from "@/lib/admin/analytics";
import { useCounted, useCustomers } from "@/lib/admin/hooks";
import { exportCSV, exportExcel } from "@/lib/admin/export";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";

function ChartCard({ title, description, children, legend, className }: { title: string; description?: string; children: React.ReactNode; legend?: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={legend} />
      <div className="px-2 pb-3 pt-4">{children}</div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { orders, priv, products, costs, categories, settings } = useAdminData();
  const { data: customers } = useCustomers();
  const rs = useRangeState("30d");
  const { range } = rs;
  const counted = useCounted(settings.profitCountsStatuses);

  const d = useMemo(() => {
    if (!orders) return null;
    return {
      cur: metrics(orders, priv, counted, customers, range.start, range.end),
      prev: metrics(orders, priv, counted, customers, range.prevStart, range.prevEnd),
      series: timeSeries(orders, priv, counted, customers, range),
      br: breakdowns(orders, products ?? [], range),
      inRange: orders.filter((o) => o.createdAt >= range.start && o.createdAt <= range.end),
    };
  }, [orders, priv, counted, customers, range, products]);

  const catName = useMemo(() => new Map((categories ?? []).map((c) => [c.slug, c.name])), [categories]);

  const exports = {
    sales: () => d!.series.map((p) => ({ Period: p.label, Orders: p.orders, Sales: p.sales, Revenue: p.revenue, Cost: p.cost, Profit: p.profit, "New customers": p.customers })),
    orders: () =>
      d!.inRange.map((o) => ({
        "Order #": o.orderNumber,
        Date: new Date(o.createdAt).toLocaleString("en-PK"),
        Customer: o.customer.name,
        Phone: o.customer.phone,
        Email: o.customer.email,
        City: o.shipping.city,
        Address: o.shipping.address,
        Items: o.items.map((i) => `${i.name} (${i.size}/${i.color}) x${i.qty}`).join("; "),
        Subtotal: o.subtotal,
        Discount: o.discount,
        Coupon: o.couponCode ?? "",
        Delivery: o.deliveryCharge,
        Total: o.total,
        Payment: PAYMENT_LABELS[o.payment.method],
        "Payment status": o.payment.status,
        Status: STATUS_LABELS[o.status],
        Courier: o.courier?.name ?? "",
        Tracking: o.courier?.trackingNumber ?? "",
      })),
    profit: () =>
      d!.inRange.map((o) => {
        const p = priv.get(o.id);
        return { "Order #": o.orderNumber, Date: new Date(o.createdAt).toLocaleDateString("en-PK"), Status: STATUS_LABELS[o.status], Counted: counted.includes(o.status) ? "Yes" : "No", Revenue: p?.revenue ?? 0, Cost: p?.cost ?? 0, Profit: p?.profit ?? 0 };
      }),
    products: () =>
      (products ?? []).map((p) => ({ Name: p.name, SKU: p.sku, Category: catName.get(p.categorySlug) ?? p.categorySlug, Price: p.price, "Sale price": p.salePrice ?? "", "Cost price": costs.get(p.id) ?? 0, Stock: p.totalStock, Sold: p.soldCount, Active: p.active ? "Yes" : "No", Featured: p.featured ? "Yes" : "No" })),
  };

  const doExport = (kind: keyof typeof exports, type: "csv" | "xls") => {
    if (!d) return;
    const rows = exports[kind]();
    const ok = type === "csv" ? exportCSV(`ah-${kind}`, rows) : exportExcel(`ah-${kind}`, rows);
    if (ok) toast.success(`Exported ${rows.length} rows`);
    else toast.error("Nothing to export for this period");
  };

  const sk = <div className="skeleton mx-3 h-[260px] rounded-lg" />;
  const margin = d && d.cur.revenue ? Math.round((d.cur.profit / d.cur.revenue) * 100) : 0;
  const closed = d ? d.inRange.filter((o) => isClosed(o.status)).length : 0;

  return (
    <>
      <PageHeader title="Analytics & reports" description="Sales, profit and customer insights. Profit uses your cost prices — never shown to customers." actions={<RangePicker state={rs} />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-6">
        <StatCard label="Sales" icon={Banknote} value={d ? formatPKR(d.cur.sales) : "—"} delta={d ? pctChange(d.cur.sales, d.prev.sales) : undefined} />
        <StatCard label="Revenue (counted)" icon={Receipt} value={d ? formatPKR(d.cur.revenue) : "—"} delta={d ? pctChange(d.cur.revenue, d.prev.revenue) : undefined} />
        <StatCard label="Profit" icon={TrendingUp} value={d ? formatPKR(d.cur.profit) : "—"} delta={d ? pctChange(d.cur.profit, d.prev.profit) : undefined} hint={`${margin}% margin`} />
        <StatCard label="Orders" icon={ShoppingBag} value={d ? d.cur.orders : "—"} delta={d ? pctChange(d.cur.orders, d.prev.orders) : undefined} hint={closed ? `${closed} cancelled/returned` : undefined} />
        <StatCard label="Avg. order value" icon={Wallet} value={d ? formatPKR(d.cur.aov) : "—"} delta={d ? pctChange(d.cur.aov, d.prev.aov) : undefined} />
        <StatCard label="New customers" icon={UserPlus} value={d ? d.cur.newCustomers : "—"} delta={d ? pctChange(d.cur.newCustomers, d.prev.newCustomers) : undefined} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Sales over time" description="Order value excluding cancelled / returned">{d ? <TrendArea data={d.series} dataKey="sales" name="Sales" /> : sk}</ChartCard>
        <ChartCard title="Profit over time" description={`Orders with status: ${counted.join(", ")}`}>{d ? <TrendLine data={d.series} lines={[{ key: "profit", name: "Profit", color: SERIES[0] }]} /> : sk}</ChartCard>
        <ChartCard
          title="Revenue vs cost vs profit"
          description="Counted orders"
          legend={<Legend items={[{ label: "Revenue", color: SERIES[2] }, { label: "Cost", color: SERIES[1] }, { label: "Profit", color: SERIES[0] }]} />}
        >
          {d ? <GroupedBars data={d.series} bars={[{ key: "revenue", name: "Revenue", color: SERIES[2] }, { key: "cost", name: "Cost", color: SERIES[1] }, { key: "profit", name: "Profit", color: SERIES[0] }]} /> : sk}
        </ChartCard>
        <ChartCard title="Orders over time" description="Non-cancelled orders">{d ? <GroupedBars data={d.series} format="num" bars={[{ key: "orders", name: "Orders", color: SERIES[2] }]} /> : sk}</ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Orders by status" description={range.label} />
          <div className="p-5">{d ? <Donut data={d.br.status} center={{ label: "orders", value: String(d.inRange.length) }} /> : <div className="skeleton h-[220px] rounded-lg" />}</div>
        </Card>
        <Card>
          <CardHeader title="Payment methods" description="Share of orders" />
          <div className="p-5">{d ? <Donut data={d.br.payments.map((p) => ({ name: p.name, value: p.value }))} center={{ label: "paid via", value: String(d.br.payments.reduce((a, p) => a + p.value, 0)) }} /> : <div className="skeleton h-[220px] rounded-lg" />}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Top products" description="By revenue">{d ? d.br.topProducts.length ? <HorizontalBars data={d.br.topProducts} dataKey="revenue" labelKey="name" name="Revenue" /> : <Empty /> : sk}</ChartCard>
        <ChartCard title="Sales by category">{d ? d.br.categories.length ? <HorizontalBars data={d.br.categories.map((c) => ({ name: catName.get(c.slug) ?? c.slug, value: c.value }))} dataKey="value" labelKey="name" name="Sales" color={SERIES[1]} /> : <Empty /> : sk}</ChartCard>
        <ChartCard title="Sales by city" description="Top 10 cities">{d ? d.br.cities.length ? <HorizontalBars data={d.br.cities} dataKey="sales" labelKey="city" name="Sales" color={SERIES[2]} /> : <Empty /> : sk}</ChartCard>
        <ChartCard title="New customers" description="Sign-ups over time">{d ? <TrendLine data={d.series} format="num" lines={[{ key: "customers", name: "New customers", color: SERIES[4] }]} /> : sk}</ChartCard>
      </div>

      <Card className="mt-6">
        <CardHeader title="Export reports" description={`Downloads use the selected period (${range.label}). Excel files open directly in Microsoft Excel or Google Sheets.`} />
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { k: "sales", t: "Sales summary", s: "Per-period totals" },
              { k: "orders", t: "Orders", s: "Every order with customer & items" },
              { k: "profit", t: "Profit report", s: "Revenue, cost & profit per order" },
              { k: "products", t: "Products & stock", s: "Full catalogue with cost price" },
            ] as const
          ).map((x) => (
            <div key={x.k} className="rounded-lg border border-border p-4">
              <p className="font-semibold">{x.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{x.s}</p>
              <div className="mt-3 flex gap-2">
                <AButton size="sm" variant="subtle" onClick={() => doExport(x.k, "csv")}>
                  <Download /> CSV
                </AButton>
                <AButton size="sm" variant="subtle" onClick={() => doExport(x.k, "xls")}>
                  <FileSpreadsheet /> Excel
                </AButton>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Empty() {
  return <p className="grid h-40 place-items-center text-sm text-muted-foreground">No sales in this period yet.</p>;
}
