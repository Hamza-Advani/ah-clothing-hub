"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, MapPin, Package, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { useMyOrders } from "@/hooks/use-my-orders";
import { OrderStatusBadge } from "@/components/store/order-timeline";
import { phoneSchema } from "@/lib/validation";
import { formatDate, formatPKR } from "@/lib/utils";

const schema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), phone: phoneSchema.or(z.literal("")) });

export default function AccountOverview() {
  const { user, profile, updateProfile } = useAuth();
  const orders = useMyOrders();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({ name: profile?.name ?? user?.name ?? "", phone: profile?.phone ?? "" });
  }, [profile, user, reset]);

  const save = async (v: z.infer<typeof schema>) => {
    try {
      await updateProfile(v);
      toast.success("Profile updated");
      reset(v);
    } catch {
      toast.error("Couldn't update profile. Please try again.");
    }
  };

  const spent = orders?.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.total, 0) ?? 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Package, label: "Orders", value: orders ? String(orders.length) : "—" },
          { icon: Wallet, label: "Total spent", value: orders ? formatPKR(spent) : "—" },
          { icon: MapPin, label: "Saved addresses", value: String(profile?.addresses.length ?? 0) },
        ].map(({ icon: I, label, value }) => (
          <div key={label} className="rounded-[6px] border border-border bg-surface p-5">
            <I className="size-5 text-accent" strokeWidth={1.6} />
            <p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold">View all <ArrowRight className="size-4" /></Link>
        </div>
        {orders === null ? (
          <div className="skeleton h-24 rounded-[6px]" />
        ) : orders.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No orders yet. <Link href="/shop" className="font-semibold text-foreground underline">Start shopping</Link></div>
        ) : (
          <ul className="divide-y divide-border rounded-[6px] border border-border bg-surface">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={o.status} />
                    <span className="hidden text-sm font-semibold tabular-nums sm:inline">{formatPKR(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[6px] border border-border bg-surface p-6 md:p-8">
        <h2 className="font-display text-2xl">Profile details</h2>
        <form onSubmit={handleSubmit(save)} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
          <Field label="Full name" htmlFor="pname" error={errors.name?.message}><Input id="pname" {...register("name")} invalid={!!errors.name} /></Field>
          <Field label="Mobile number" htmlFor="pphone" error={errors.phone?.message}><Input id="pphone" type="tel" placeholder="03XX XXXXXXX" {...register("phone")} invalid={!!errors.phone} /></Field>
          <Field label="Email" htmlFor="pemail" hint="Email can't be changed" className="sm:col-span-2"><Input id="pemail" value={user?.email ?? ""} disabled readOnly /></Field>
          <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
        </form>
      </section>
    </div>
  );
}
