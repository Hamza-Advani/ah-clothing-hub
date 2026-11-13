"use client";
import { useState } from "react";
import { Crown, Info, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { AButton, AField, AInput, ASelect, Card, ConfirmDialog, EmptyBlock, PageHeader, Table, TableSkeleton } from "@/components/admin/ui";
import { Checkbox, Modal } from "@/components/ui/radix";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdmins } from "@/lib/admin/hooks";
import { adminApi, run } from "@/lib/admin/actions";
import { formatDate } from "@/lib/utils";
import type { AdminMember } from "@/lib/admin/demo";
import { PERMISSIONS } from "@/lib/admin/permissions";

export default function TeamPage() {
  const { user } = useAuth();
  const { data: admins } = useAdmins();
  const [add, setAdd] = useState(false);
  const [del, setDel] = useState<AdminMember | null>(null);

  return (
    <>
      <PageHeader title="Team & roles" description="Give your staff access to the admin panel." actions={<AButton onClick={() => setAdd(true)}><Plus /> Add member</AButton>} />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Card className="flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent"><Crown className="size-4" /></span>
          <div><p className="text-sm font-semibold">Admin</p><p className="text-xs text-muted-foreground">Full access — settings, team, deleting products, blocking customers.</p></div>
        </Card>
        <Card className="flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald/10 text-emerald dark:text-[#6fb7a3]"><ShieldCheck className="size-4" /></span>
          <div><p className="text-sm font-semibold">Staff</p><p className="text-xs text-muted-foreground">Day-to-day work — orders, products, reviews, messages. Can&apos;t change settings or team.</p></div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        {!admins ? (
          <TableSkeleton rows={3} />
        ) : admins.length === 0 ? (
          <EmptyBlock icon={UserCog} title="No team members" />
        ) : (
          <Table>
            <thead><tr><th>Member</th><th>Role</th><th>Access</th><th>Added</th><th className="w-12" /></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.uid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-muted text-[13px] font-bold uppercase text-accent">{(a.name || a.email).slice(0, 1)}</span>
                      <div>
                        <p className="font-semibold">{a.name || a.email.split("@")[0]} {a.uid === user?.uid && <span className="text-xs font-normal text-muted-foreground">(you)</span>}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><Badge shape="pill" variant={a.role === "admin" ? "bestseller" : "info"} className="capitalize">{a.role}</Badge></td>
                  <td className="max-w-xs text-xs text-muted-foreground">{a.role === "admin" || a.permissions?.includes("*") ? "Everything" : (a.permissions ?? []).map((p) => PERMISSIONS.find((x) => x.key === p)?.label ?? p).join(", ") || "—"}</td>
                  <td className="text-muted-foreground">{a.createdAt ? formatDate(a.createdAt) : "—"}</td>
                  <td>{a.uid !== user?.uid && <AButton size="icon-sm" variant="ghost" className="text-sale" aria-label="Remove access" onClick={() => setDel(a)}><Trash2 /></AButton>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={add} onOpenChange={setAdd} title="Add team member" description="They must first create an account on your store (Sign up), then you can give them access here." className="max-w-lg">
        {add && <AddForm onDone={() => setAdd(false)} />}
      </Modal>
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title={`Remove ${del?.email}?`} description="They will lose access to the admin panel immediately (their customer account stays)." confirmLabel="Remove access" destructive onConfirm={async () => { if (del) await run(adminApi.removeAdmin(del.uid), "Access removed"); }} />
    </>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [perms, setPerms] = useState<string[]>(["orders", "products", "messages"]);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const ok = await run(adminApi.addAdmin({ email: email.trim().toLowerCase(), role, permissions: role === "admin" ? ["*"] : perms }), `${email} added as ${role}`);
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <div className="space-y-4">
      <AField label="Email of their store account"><AInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@email.com" /></AField>
      <AField label="Role">
        <ASelect value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")}>
          <option value="staff">Staff</option>
          <option value="admin">Admin (full access)</option>
        </ASelect>
      </AField>
      {role === "staff" && (
        <AField label="Sections they can open">
          <div className="grid grid-cols-2 gap-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Checkbox checked={perms.includes(p.key)} onCheckedChange={(v) => setPerms(v ? [...perms, p.key] : perms.filter((x) => x !== p.key))} /> {p.label}
              </label>
            ))}
          </div>
        </AField>
      )}
      <p className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"><Info className="size-4 shrink-0" /> The new member should refresh the admin page (or log out and in) to get access.</p>
      <div className="flex justify-end gap-2">
        <AButton variant="subtle" onClick={onDone}>Cancel</AButton>
        <AButton onClick={submit} loading={busy} disabled={!/^\S+@\S+\.\S+$/.test(email)}>Give access</AButton>
      </div>
    </div>
  );
}
