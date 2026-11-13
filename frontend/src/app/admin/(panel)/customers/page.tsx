"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Users } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, ASelect, Card, EmptyBlock, PageHeader, Pager, SearchBox, StatCard, Table, TableSkeleton, usePaged } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/lib/admin/hooks";
import { exportCSV } from "@/lib/admin/export";
import { formatDate, formatPKR } from "@/lib/utils";
import { Banknote, UserCheck, UserPlus } from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers } = useCustomers();
  const { orders } = useAdminData();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // live order stats per customer (more accurate than counters on the profile)
  const stats = useMemo(() => {
    const m = new Map<string, { orders: number; spent: number; last: number }>();
    for (const o of orders ?? []) {
      if (!o.userId) continue;
      const s = m.get(o.userId) ?? { orders: 0, spent: 0, last: 0 };
      s.orders++;
      if (o.status !== "cancelled" && o.status !== "returned") s.spent += o.total;
      s.last = Math.max(s.last, o.createdAt);
      m.set(o.userId, s);
    }
    return m;
  }, [orders]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = (customers ?? []).filter(
      (c) =>
        (filter === "all" || (filter === "blocked" ? c.blocked : filter === "buyers" ? (stats.get(c.uid)?.orders ?? 0) > 0 : filter === "staff" ? c.role !== "customer" : !(stats.get(c.uid)?.orders ?? 0))) &&
        (!s || c.name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || (c.phone ?? "").replace(/\s/g, "").includes(s.replace(/\s/g, ""))),
    );
    const st = (uid: string) => stats.get(uid) ?? { orders: 0, spent: 0, last: 0 };
    if (sort === "spent") out.sort((a, b) => st(b.uid).spent - st(a.uid).spent);
    else if (sort === "orders") out.sort((a, b) => st(b.uid).orders - st(a.uid).orders);
    else if (sort === "recent") out.sort((a, b) => st(b.uid).last - st(a.uid).last);
    else out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [customers, q, filter, sort, stats]);

  const paged = usePaged(list, 25);
  const buyers = (customers ?? []).filter((c) => (stats.get(c.uid)?.orders ?? 0) > 0).length;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const newThisMonth = (customers ?? []).filter((c) => c.createdAt >= monthStart).length;
  const totalSpent = [...stats.values()].reduce((a, s) => a + s.spent, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has created an account. Guest orders are listed under Orders."
        actions={
          <AButton variant="subtle" disabled={!list.length} onClick={() => exportCSV("ah-customers", list.map((c) => ({ Name: c.name, Email: c.email, Phone: c.phone ?? "", Orders: stats.get(c.uid)?.orders ?? 0, "Total spent": stats.get(c.uid)?.spent ?? 0, Joined: formatDate(c.createdAt), Blocked: c.blocked ? "Yes" : "No" })))}>
            <Download /> Export
          </AButton>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total customers" icon={Users} value={customers ? customers.length : "—"} />
        <StatCard label="Have ordered" icon={UserCheck} value={customers ? buyers : "—"} hint={customers?.length ? `${Math.round((buyers / customers.length) * 100)}% conversion` : undefined} />
        <StatCard label="New this month" icon={UserPlus} value={customers ? newThisMonth : "—"} />
        <StatCard label="Avg. lifetime value" icon={Banknote} value={buyers ? formatPKR(totalSpent / buyers) : "—"} />
      </div>
      <Card className="overflow-hidden">
        <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-[minmax(220px,2fr)_1fr_1fr]">
          <SearchBox value={q} onChange={(v) => { setQ(v); paged.setPage(1); }} placeholder="Search name, email or phone" />
          <ASelect value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
            <option value="all">All customers</option>
            <option value="buyers">Have ordered</option>
            <option value="none">No orders yet</option>
            <option value="blocked">Blocked</option>
            <option value="staff">Admins & staff</option>
          </ASelect>
          <ASelect value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="spent">Top spenders</option>
            <option value="orders">Most orders</option>
            <option value="recent">Recently ordered</option>
          </ASelect>
        </div>
        {!customers ? (
          <TableSkeleton rows={8} />
        ) : list.length === 0 ? (
          <EmptyBlock icon={Users} title={customers.length ? "No customers match" : "No customers yet"} description="Customers appear here when they sign up on your store." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Total spent</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.slice.map((c) => {
                  const s = stats.get(c.uid);
                  return (
                    <tr key={c.uid} onClick={() => router.push(`/admin/customers/${c.uid}`)} className="cursor-pointer transition hover:bg-muted/50">
                      <td>
                        <Link href={`/admin/customers/${c.uid}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-bold uppercase text-accent">{(c.name || c.email || "?").slice(0, 1)}</span>
                          <span className="min-w-0">
                            <span className="block font-semibold hover:text-accent">{c.name || "—"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-muted-foreground">{c.phone || "—"}</td>
                      <td className="text-right tabular-nums">{s?.orders ?? 0}</td>
                      <td className="text-right font-semibold tabular-nums">{formatPKR(s?.spent ?? 0)}</td>
                      <td className="text-muted-foreground">{formatDate(c.createdAt)}</td>
                      <td>
                        <div className="flex gap-1">
                          {c.blocked ? <Badge variant="danger" shape="pill">Blocked</Badge> : <Badge variant="success" shape="pill">Active</Badge>}
                          {c.role !== "customer" && <Badge variant="info" shape="pill" className="capitalize">{c.role}</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pager {...paged} />
          </>
        )}
      </Card>
    </>
  );
}
