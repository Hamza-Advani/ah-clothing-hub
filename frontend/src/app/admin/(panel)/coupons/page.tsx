"use client";
import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AButton, AField, AInput, ASelect, Card, ConfirmDialog, EmptyBlock, PageHeader, StatCard, Table, TableSkeleton } from "@/components/admin/ui";
import { Modal, Switch } from "@/components/ui/radix";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/components/admin/admin-data";
import { useCoupons, useNow } from "@/lib/admin/hooks";
import { adminApi, run } from "@/lib/admin/actions";
import { cn, formatDate, formatPKR } from "@/lib/utils";
import type { Coupon } from "@/lib/types";
import { BadgePercent, CircleCheck, Receipt } from "lucide-react";

const label = (c: Coupon) => (c.type === "percent" ? `${c.value}% off${c.maxDiscount ? ` (max ${formatPKR(c.maxDiscount)})` : ""}` : `${formatPKR(c.value)} off`);
const body = (c: Coupon) => ({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxDiscount: c.maxDiscount, expiresAt: c.expiresAt, usageLimit: c.usageLimit, active: c.active });

export default function CouponsPage() {
  const { data: coupons } = useCoupons();
  const { orders } = useAdminData();
  const [edit, setEdit] = useState<Coupon | "new" | null>(null);
  const [del, setDel] = useState<Coupon | null>(null);

  const usage = useMemo(() => {
    const m = new Map<string, { orders: number; discount: number }>();
    for (const o of orders ?? []) {
      if (!o.couponCode) continue;
      const u = m.get(o.couponCode) ?? { orders: 0, discount: 0 };
      u.orders++;
      u.discount += o.discount;
      m.set(o.couponCode, u);
    }
    return m;
  }, [orders]);

  const now = useNow();
  const status = (c: Coupon) => (!c.active ? "Inactive" : c.expiresAt && c.expiresAt < now ? "Expired" : c.usageLimit && c.usedCount >= c.usageLimit ? "Used up" : "Active");
  const activeCount = (coupons ?? []).filter((c) => status(c) === "Active").length;
  const totalDiscount = [...usage.values()].reduce((a, u) => a + u.discount, 0);
  const totalUses = [...usage.values()].reduce((a, u) => a + u.orders, 0);

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can enter at checkout. The backend re-checks every rule when an order is placed." actions={<AButton onClick={() => setEdit("new")}><Plus /> Create coupon</AButton>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Active coupons" icon={CircleCheck} value={coupons ? activeCount : "—"} />
        <StatCard label="Times used" icon={Receipt} value={totalUses} />
        <StatCard label="Total discount given" icon={BadgePercent} value={formatPKR(totalDiscount)} />
      </div>
      <Card className="overflow-hidden">
        {!coupons ? (
          <TableSkeleton rows={4} />
        ) : coupons.length === 0 ? (
          <EmptyBlock icon={Ticket} title="No coupons yet" description="Create codes like WELCOME10 or EID500 to boost sales." action={<AButton onClick={() => setEdit("new")}><Plus /> Create coupon</AButton>} />
        ) : (
          <Table>
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Usage</th><th>Expires</th><th>Status</th><th className="w-28" /></tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const st = status(c);
                const pct = c.usageLimit ? Math.min(100, (c.usedCount / c.usageLimit) * 100) : 0;
                return (
                  <tr key={c.code} className="transition hover:bg-muted/50">
                    <td>
                      <button onClick={() => navigator.clipboard?.writeText(c.code).then(() => toast.success("Code copied"))} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-accent/60 bg-accent/5 px-2 py-1 font-mono text-[13px] font-bold tracking-wider" title="Copy code">
                        {c.code} <Copy className="size-3 opacity-60" />
                      </button>
                    </td>
                    <td className="font-medium">{label(c)}</td>
                    <td className="tabular-nums text-muted-foreground">{c.minOrder ? formatPKR(c.minOrder) : "—"}</td>
                    <td className="min-w-36">
                      <p className="text-xs tabular-nums"><b>{c.usedCount}</b>{c.usageLimit ? ` / ${c.usageLimit}` : " uses"} {usage.get(c.code) && <span className="text-muted-foreground">· {formatPKR(usage.get(c.code)!.discount)} saved</span>}</p>
                      {c.usageLimit ? <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div> : null}
                    </td>
                    <td className="text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                    <td><Badge shape="pill" variant={st === "Active" ? "success" : st === "Inactive" ? "neutral" : "danger"}>{st}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Switch checked={c.active} onCheckedChange={(v) => run(adminApi.updateCoupon(c.code, { ...body(c), active: v }), v ? "Coupon activated" : "Coupon paused")} aria-label="Active" />
                        <AButton size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEdit(c)}><Pencil /></AButton>
                        <AButton size="icon-sm" variant="ghost" aria-label="Delete" className="text-sale" onClick={() => setDel(c)}><Trash2 /></AButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!edit} onOpenChange={(v) => !v && setEdit(null)} title={edit === "new" ? "Create coupon" : `Edit ${edit ? edit.code : ""}`} className="max-w-lg">
        {edit && <CouponForm key={edit === "new" ? "new" : edit.code} coupon={edit === "new" ? null : edit} onDone={() => setEdit(null)} />}
      </Modal>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Delete ${del?.code}?`} description="Customers won't be able to use this code anymore. Past orders are not affected." confirmLabel="Delete" destructive onConfirm={async () => { if (del) await run(adminApi.deleteCoupon(del.code), "Coupon deleted"); }} />
    </>
  );
}

const iso = (t: number | null) => (t ? new Date(t).toISOString().slice(0, 10) : "");

function CouponForm({ coupon, onDone }: { coupon: Coupon | null; onDone: () => void }) {
  const [f, setF] = useState({
    code: coupon?.code ?? "",
    type: coupon?.type ?? ("percent" as "percent" | "fixed"),
    value: String(coupon?.value ?? ""),
    minOrder: String(coupon?.minOrder || ""),
    maxDiscount: String(coupon?.maxDiscount ?? ""),
    expires: iso(coupon?.expiresAt ?? null),
    usageLimit: String(coupon?.usageLimit ?? ""),
    active: coupon?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  const save = async () => {
    const e: Record<string, string> = {};
    const code = f.code.trim().toUpperCase();
    const value = Number(f.value);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) e.code = "3–30 letters/numbers, no spaces";
    if (!(value > 0)) e.value = "Enter a value";
    if (f.type === "percent" && value > 90) e.value = "Max 90%";
    setErr(e);
    if (Object.keys(e).length) return;
    const payload = {
      code,
      type: f.type,
      value,
      minOrder: Number(f.minOrder) || 0,
      maxDiscount: f.type === "percent" && Number(f.maxDiscount) > 0 ? Number(f.maxDiscount) : null,
      expiresAt: f.expires ? new Date(f.expires + "T23:59:59").getTime() : null,
      usageLimit: Number(f.usageLimit) > 0 ? Math.floor(Number(f.usageLimit)) : null,
      active: f.active,
    };
    setBusy(true);
    const ok = await run(coupon ? adminApi.updateCoupon(coupon.code, payload) : adminApi.createCoupon(payload), coupon ? "Coupon saved" : "Coupon created");
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <AField label="Code" error={err.code}><AInput value={f.code} disabled={!!coupon} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") })} placeholder="WELCOME10" className="font-mono tracking-wider" invalid={!!err.code} /></AField>
        <AField label="Type">
          <ASelect value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "percent" | "fixed" })}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount (Rs.)</option>
          </ASelect>
        </AField>
        <AField label={f.type === "percent" ? "Discount %" : "Discount (Rs.)"} error={err.value}><AInput inputMode="numeric" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} invalid={!!err.value} /></AField>
        <AField label="Minimum order (Rs.)" hint="0 = no minimum"><AInput inputMode="numeric" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} /></AField>
        {f.type === "percent" && <AField label="Max discount (Rs.)" hint="Optional cap"><AInput inputMode="numeric" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} /></AField>}
        <AField label="Usage limit" hint="Total uses · empty = unlimited"><AInput inputMode="numeric" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} /></AField>
        <AField label="Expiry date" hint="Empty = never expires"><AInput type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></AField>
      </div>
      <label className={cn("flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium")}>Active <Switch checked={f.active} onCheckedChange={(active) => setF({ ...f, active })} /></label>
      <div className="flex justify-end gap-2">
        <AButton variant="subtle" onClick={onDone}>Cancel</AButton>
        <AButton onClick={save} loading={busy}>{coupon ? "Save" : "Create coupon"}</AButton>
      </div>
    </div>
  );
}
