"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Checkbox, Modal } from "@/components/ui/radix";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { useAuth } from "@/components/providers/auth-provider";
import { addressSchema } from "@/lib/validation";
import { PK_CITIES } from "@/lib/constants";
import type { Address } from "@/lib/types";

type Values = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { profile, saveAddresses } = useAuth();
  const addresses = profile?.addresses ?? [];
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  const persist = async (next: Address[], msg: string) => {
    try {
      // exactly one default
      if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true;
      await saveAddresses(next);
      toast.success(msg);
    } catch {
      toast.error("Couldn't save address. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-3xl">Saved addresses</h2>
        {addresses.length > 0 && <Button size="sm" onClick={() => setEditing("new")}><Plus /> Add new</Button>}
      </div>
      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Save an address for one-tap checkout next time." action={<Button onClick={() => setEditing("new")}><Plus /> Add address</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-[6px] border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold">{a.label}{a.isDefault && <Badge variant="success" shape="pill">Default</Badge>}</p>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(a)} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Edit address"><Pencil className="size-3.5" /></button>
                  <button onClick={() => persist(addresses.filter((x) => x.id !== a.id), "Address removed")} className="grid size-8 place-items-center rounded-full hover:bg-muted hover:text-sale" aria-label="Delete address"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
              <p className="mt-3 text-sm">{a.name}</p>
              <p className="text-sm text-muted-foreground">{a.address}, {a.city}</p>
              <p className="text-sm text-muted-foreground">{a.phone}</p>
              {!a.isDefault && (
                <button onClick={() => persist(addresses.map((x) => ({ ...x, isDefault: x.id === a.id })), "Default address updated")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent"><Star className="size-3.5" /> Set as default</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <AddressForm
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            const id = editing === "new" ? crypto.randomUUID() : editing.id;
            const item: Address = { id, ...v, isDefault: !!v.isDefault || addresses.length === 0 };
            let next = editing === "new" ? [...addresses, item] : addresses.map((a) => (a.id === id ? item : a));
            if (item.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === id }));
            await persist(next, editing === "new" ? "Address added" : "Address updated");
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function AddressForm({ initial, onClose, onSave }: { initial?: Address; onClose: () => void; onSave: (v: Values) => Promise<void> }) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial ?? { label: "Home", city: "", isDefault: false },
  });
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={initial ? "Edit address" : "New address"}>
      <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Label" htmlFor="a-label" error={errors.label?.message}><Input id="a-label" placeholder="Home / Office" {...register("label")} invalid={!!errors.label} /></Field>
        <Field label="Recipient name" htmlFor="a-name" error={errors.name?.message}><Input id="a-name" {...register("name")} invalid={!!errors.name} /></Field>
        <Field label="Mobile" htmlFor="a-phone" error={errors.phone?.message} className="sm:col-span-2"><Input id="a-phone" type="tel" placeholder="03XX XXXXXXX" {...register("phone")} invalid={!!errors.phone} /></Field>
        <Field label="Address" htmlFor="a-addr" error={errors.address?.message} className="sm:col-span-2"><Input id="a-addr" placeholder="House #, street, area" {...register("address")} invalid={!!errors.address} /></Field>
        <Field label="City" htmlFor="a-city" error={errors.city?.message} className="sm:col-span-2">
          <NativeSelect id="a-city" {...register("city")} invalid={!!errors.city}><option value="">Select city</option>{PK_CITIES.map((c) => <option key={c}>{c}</option>)}</NativeSelect>
        </Field>
        <label className="flex items-center gap-2.5 text-sm sm:col-span-2"><Checkbox checked={watch("isDefault")} onCheckedChange={(v) => setValue("isDefault", !!v)} /> Set as default address</label>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={isSubmitting} className="flex-1">Save address</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
