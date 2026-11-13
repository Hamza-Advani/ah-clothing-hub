"use client";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ArrowLeft, Ban, Mail, MapPin, MessageCircle, Phone, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, Card, CardHeader, ConfirmDialog, EmptyBlock, FullLoader, PageHeader, StatCard, StatusBadge, Table } from "@/components/admin/ui";
import { EmailDialog, WhatsAppDialog } from "@/components/admin/comm-dialogs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useCustomers } from "@/lib/admin/hooks";
import { adminApi, run } from "@/lib/admin/actions";
import { adminDemoMode } from "@/lib/admin/live";
import { formatDate, formatPKR } from "@/lib/utils";
import { Banknote, CalendarDays, Receipt } from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const { isAdmin } = useAuth();
  const { data: customers } = useCustomers();
  const { orders } = useAdminData();
  const [block, setBlock] = useState(false);
  const [email, setEmail] = useState(false);
  const [wa, setWa] = useState(false);
  const c = customers?.find((x) => x.uid === uid);
  const mine = useMemo(() => (orders ?? []).filter((o) => o.userId === uid), [orders, uid]);

  if (!customers || !orders) return <FullLoader label="Loading customer…" />;
  if (!c) return <EmptyBlock icon={User} title="Customer not found" action={<AButton asChild variant="subtle"><Link href="/admin/customers">Back to customers</Link></AButton>} />;

  const live = mine.filter((o) => o.status !== "cancelled" && o.status !== "returned");
  const spent = live.reduce((a, o) => a + o.total, 0);
  const phone = c.phone || mine[0]?.customer.phone || "";

  return (
    <>
      <PageHeader
        back={<Link href="/admin/customers" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Customers</Link>}
        title={c.name || c.email}
        description={<span className="flex flex-wrap items-center gap-2">Customer since {formatDate(c.createdAt)} {c.blocked ? <Badge variant="danger" shape="pill">Blocked</Badge> : <Badge variant="success" shape="pill">Active</Badge>} {c.role !== "customer" && <Badge variant="info" shape="pill" className="capitalize">{c.role}</Badge>}</span>}
        actions={
          <>
            {phone && <AButton variant="subtle" onClick={() => setWa(true)}><MessageCircle /> WhatsApp</AButton>}
            <AButton variant="subtle" onClick={() => setEmail(true)}><Mail /> Email</AButton>
            {(isAdmin || adminDemoMode) && c.role === "customer" && (
              <AButton variant="subtle" className={c.blocked ? "text-success" : "text-sale"} onClick={() => setBlock(true)}>
                {c.blocked ? <><ShieldCheck /> Unblock</> : <><Ban /> Block</>}
              </AButton>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Orders" icon={ShoppingBag} value={mine.length} hint={mine.length - live.length ? `${mine.length - live.length} cancelled/returned` : undefined} />
        <StatCard label="Total spent" icon={Banknote} value={formatPKR(spent)} />
        <StatCard label="Avg. order" icon={Receipt} value={live.length ? formatPKR(spent / live.length) : "—"} />
        <StatCard label="Last order" icon={CalendarDays} value={mine[0] ? formatDate(mine[0].createdAt) : "—"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold">Contact</h3>
            <p className="flex items-center gap-2 break-all text-sm"><Mail className="size-4 shrink-0 text-muted-foreground" /> {c.email}</p>
            <p className="mt-2 flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground" /> {phone || "—"}</p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold">Saved addresses</h3>
            {c.addresses?.length ? (
              <ul className="space-y-3">
                {c.addresses.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="flex items-center gap-2 font-semibold"><MapPin className="size-3.5 text-accent" /> {a.label} {a.isDefault && <Badge variant="outline" shape="pill">Default</Badge>}</p>
                    <p className="mt-1 text-muted-foreground">{a.name} · {a.phone}</p>
                    <p className="text-muted-foreground">{a.address}, {a.city}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            )}
          </Card>
        </div>
        <Card className="overflow-hidden">
          <CardHeader title="Order history" />
          <div className="mt-3">
            {mine.length === 0 ? (
              <EmptyBlock icon={ShoppingBag} title="No orders yet" />
            ) : (
              <Table>
                <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {mine.map((o) => (
                    <tr key={o.id} className="transition hover:bg-muted/50">
                      <td><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-accent">{o.orderNumber}</Link></td>
                      <td className="text-muted-foreground">{formatDate(o.createdAt)}</td>
                      <td className="max-w-[260px] truncate text-muted-foreground">{o.items.map((i) => i.name).join(", ")}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-right font-semibold tabular-nums">{formatPKR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={block}
        onOpenChange={setBlock}
        title={c.blocked ? "Unblock this customer?" : "Block this customer?"}
        description={c.blocked ? "They will be able to log in and place orders again." : "They will be logged out everywhere and can't log in or place orders until unblocked."}
        confirmLabel={c.blocked ? "Unblock" : "Block customer"}
        destructive={!c.blocked}
        onConfirm={() => run(adminApi.blockCustomer(c.uid, !c.blocked), c.blocked ? "Customer unblocked" : "Customer blocked")}
      />
      <EmailDialog open={email} onOpenChange={setEmail} to={c.email} name={c.name || c.email} message={`Hi ${(c.name || "").split(" ")[0]},\n\n`} />
      {phone && <WhatsAppDialog open={wa} onOpenChange={setWa} phone={phone} name={c.name} text={`Assalam o Alaikum ${(c.name || "").split(" ")[0]}! `} />}
    </>
  );
}
