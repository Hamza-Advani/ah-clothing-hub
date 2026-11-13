"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, AField, AInput, ASelect, ATextarea, Card, CardHeader, FullLoader, PageHeader, Segmented } from "@/components/admin/ui";
import { SingleImage } from "@/components/admin/image-uploader";
import { Checkbox, Switch } from "@/components/ui/radix";
import { adminApi, run } from "@/lib/admin/actions";
import { DEFAULT_WHATSAPP_TEMPLATES, TEMPLATE_TOKENS } from "@/lib/admin/templates";
import { ORDER_STATUSES, PK_CITIES, STATUS_LABELS } from "@/lib/constants";
import { PK_PHONE_REGEX } from "@/lib/utils";
import type { HeroBanner, OrderStatus, StoreSettings } from "@/lib/types";

type Tab = "general" | "delivery" | "payments" | "homepage" | "templates";

export default function SettingsPage() {
  const { settings, settingsReady } = useAdminData();
  if (!settingsReady) return <FullLoader label="Loading settings…" />;
  return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState<StoreSettings>(() => structuredClone(initial));
  const [tab, setTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const up = (patch: Partial<StoreSettings>) => {
    setS((p) => ({ ...p, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    if (s.storeName.trim().length < 2) return toast.error("Store name is required");
    if (s.phone && !PK_PHONE_REGEX.test(s.phone.replace(/\s/g, "").replace(/^\+92/, "0"))) toast.warning("Phone number doesn't look like a Pakistani mobile number");
    for (const k of ["jazzcash", "easypaisa"] as const) {
      if (s.payments[k].enabled && (!s.payments[k].accountNumber || !s.payments[k].accountTitle)) {
        setTab("payments");
        return toast.error(`Add the ${k === "jazzcash" ? "JazzCash" : "EasyPaisa"} account title & number (or turn it off)`);
      }
    }
    if (!s.payments.cod.enabled && !s.payments.jazzcash.enabled && !s.payments.easypaisa.enabled) return toast.error("Enable at least one payment method");
    setSaving(true);
    // strip read-only fields added by the live listener
    const { id: _id, updatedAt: _u, ...data } = s as unknown as Record<string, unknown>;
    void _id;
    void _u;
    const ok = await run(adminApi.saveSettings("store", data), "Settings saved — your store is updated");
    setSaving(false);
    if (ok) setDirty(false);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store details, delivery, payments, homepage and message templates."
        actions={<AButton onClick={save} loading={saving} disabled={!dirty}><Save /> {dirty ? "Save changes" : "Saved"}</AButton>}
      />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: "general", label: "General" },
          { value: "delivery", label: "Delivery" },
          { value: "payments", label: "Payments" },
          { value: "homepage", label: "Homepage" },
          { value: "templates", label: "Message templates" },
        ]}
      />

      {tab === "general" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader title="Store details" description="Shown in the header, footer, invoices and emails." />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <AField label="Store name"><AInput value={s.storeName} onChange={(e) => up({ storeName: e.target.value })} /></AField>
              <AField label="Tagline"><AInput value={s.tagline ?? ""} onChange={(e) => up({ tagline: e.target.value })} /></AField>
              <AField label="Phone" hint="+92 3XX XXXXXXX"><AInput value={s.phone} onChange={(e) => up({ phone: e.target.value })} /></AField>
              <AField label="WhatsApp number" hint="Used by the floating WhatsApp button"><AInput value={s.whatsapp} onChange={(e) => up({ whatsapp: e.target.value })} /></AField>
              <AField label="Email" className="sm:col-span-2"><AInput type="email" value={s.email} onChange={(e) => up({ email: e.target.value })} /></AField>
              <AField label="Address" className="sm:col-span-2"><ATextarea value={s.address} onChange={(e) => up({ address: e.target.value })} className="min-h-16" /></AField>
            </div>
            <CardHeader title="Social links" className="border-t border-border pt-5" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {(["instagram", "facebook", "tiktok", "youtube"] as const).map((k) => (
                <AField key={k} label={k[0].toUpperCase() + k.slice(1)}>
                  <AInput value={s.socials?.[k] ?? ""} placeholder={`https://${k}.com/yourpage`} onChange={(e) => up({ socials: { ...s.socials, [k]: e.target.value } })} />
                </AField>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Branding" description="Leave empty to use the AH monogram." />
            <div className="space-y-5 p-5">
              <AField label="Logo"><SingleImage value={s.logo ? { url: s.logo, publicId: "" } : null} onChange={(v) => up({ logo: v?.url ?? null })} folder="branding" aspect="aspect-[3/1]" label="Upload logo (PNG, transparent)" /></AField>
              <AField label="Favicon"><div className="w-28"><SingleImage value={s.favicon ? { url: s.favicon, publicId: "" } : null} onChange={(v) => up({ favicon: v?.url ?? null })} folder="branding" aspect="aspect-square" label="Icon" /></div></AField>
            </div>
          </Card>
        </div>
      )}

      {tab === "delivery" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title="Delivery charges" description="Applied at checkout and re-checked on the server." />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <AField label="Delivery charge (Rs.)"><AInput inputMode="numeric" value={s.deliveryCharge} onChange={(e) => up({ deliveryCharge: Math.max(0, Math.round(Number(e.target.value) || 0)) })} /></AField>
              <AField label="Free delivery above (Rs.)" hint="0 = never free"><AInput inputMode="numeric" value={s.freeDeliveryThreshold} onChange={(e) => up({ freeDeliveryThreshold: Math.max(0, Math.round(Number(e.target.value) || 0)) })} /></AField>
            </div>
            <CardHeader title="Profit reporting" description="Which order statuses count towards revenue & profit in analytics." className="border-t border-border pt-5" />
            <div className="flex flex-wrap gap-3 p-5">
              {ORDER_STATUSES.map((st) => {
                const on = s.profitCountsStatuses.includes(st);
                return (
                  <label key={st} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <Checkbox checked={on} onCheckedChange={(v) => up({ profitCountsStatuses: v ? [...s.profitCountsStatuses, st] : s.profitCountsStatuses.filter((x) => x !== st) })} /> {STATUS_LABELS[st]}
                  </label>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Cities served" description="Leave empty to deliver everywhere in Pakistan." />
            <CitiesPicker value={s.citiesServed} onChange={(citiesServed) => up({ citiesServed })} />
          </Card>
        </div>
      )}

      {tab === "payments" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Cash on Delivery</h3><Switch checked={s.payments.cod.enabled} onCheckedChange={(v) => up({ payments: { ...s.payments, cod: { enabled: v } } })} /></div>
            <p className="mt-2 text-sm text-muted-foreground">Customer pays the courier on delivery. Marked paid automatically when the order is delivered.</p>
          </Card>
          {(["jazzcash", "easypaisa"] as const).map((k) => (
            <Card key={k} className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{k === "jazzcash" ? "JazzCash" : "EasyPaisa"} (manual)</h3><Switch checked={s.payments[k].enabled} onCheckedChange={(v) => up({ payments: { ...s.payments, [k]: { ...s.payments[k], enabled: v } } })} /></div>
              <p className="text-sm text-muted-foreground">Customers send money to this account and upload a screenshot. You approve it on the order page.</p>
              <AField label="Account title"><AInput value={s.payments[k].accountTitle} onChange={(e) => up({ payments: { ...s.payments, [k]: { ...s.payments[k], accountTitle: e.target.value } } })} /></AField>
              <AField label="Account / mobile number"><AInput value={s.payments[k].accountNumber} onChange={(e) => up({ payments: { ...s.payments, [k]: { ...s.payments[k], accountNumber: e.target.value } } })} placeholder="0300 1234567" /></AField>
            </Card>
          ))}
        </div>
      )}

      {tab === "homepage" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Announcement bar" description="Short messages that scroll at the very top of the store." />
            <div className="space-y-2 p-5">
              {s.announcement.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <AInput value={a} onChange={(e) => up({ announcement: s.announcement.map((x, k) => (k === i ? e.target.value : x)) })} />
                  <AButton size="icon" variant="ghost" aria-label="Remove" onClick={() => up({ announcement: s.announcement.filter((_, k) => k !== i) })}><X /></AButton>
                </div>
              ))}
              <AButton size="sm" variant="subtle" onClick={() => up({ announcement: [...s.announcement, ""] })}><Plus /> Add message</AButton>
            </div>
          </Card>
          <Card>
            <CardHeader title="Hero banners" description="The big slider at the top of the homepage. Recommended image: 2400×1200 or larger." action={<AButton size="sm" onClick={() => up({ heroBanners: [...s.heroBanners, { id: crypto.randomUUID(), image: "", title: "", subtitle: "", ctaLabel: "Shop now", ctaLink: "/shop", order: s.heroBanners.length + 1 }] })}><Plus /> Add banner</AButton>} />
            <div className="space-y-4 p-5">
              {s.heroBanners.length === 0 && <p className="text-sm text-muted-foreground">No banners yet.</p>}
              {[...s.heroBanners].sort((a, b) => a.order - b.order).map((b, i, arr) => (
                <BannerEditor
                  key={b.id}
                  b={b}
                  index={i}
                  last={i === arr.length - 1}
                  onChange={(nb) => up({ heroBanners: s.heroBanners.map((x) => (x.id === b.id ? nb : x)) })}
                  onRemove={() => up({ heroBanners: s.heroBanners.filter((x) => x.id !== b.id) })}
                  onMove={(dir) => {
                    const other = arr[i + dir];
                    if (!other) return;
                    up({ heroBanners: arr.map((x, k) => ({ ...x, order: x.id === b.id ? i + dir + 1 : x.id === other.id ? i + 1 : k + 1 })) });
                  }}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "templates" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="WhatsApp templates" description={`Used by the "Send WhatsApp" button on orders. Placeholders: ${TEMPLATE_TOKENS.join(" ")}`} />
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              {ORDER_STATUSES.map((st) => (
                <AField key={st} label={STATUS_LABELS[st]}>
                  <ATextarea className="min-h-20" value={s.templates.whatsapp[st] ?? DEFAULT_WHATSAPP_TEMPLATES[st]} onChange={(e) => up({ templates: { ...s.templates, whatsapp: { ...s.templates.whatsapp, [st]: e.target.value } } })} />
                </AField>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Email templates" description="Pre-fills the “Send email” box on an order. Automatic status emails use the built-in branded design." />
            <EmailTemplates value={s.templates.email} onChange={(email) => up({ templates: { ...s.templates, email } })} />
          </Card>
        </div>
      )}

      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-lift">
          <span className="text-sm font-medium">You have unsaved changes</span>
          <AButton size="sm" variant="ghost" onClick={() => { setS(structuredClone(initial)); setDirty(false); }}>Discard</AButton>
          <AButton size="sm" onClick={save} loading={saving}>Save</AButton>
        </div>
      )}
    </>
  );
}

function CitiesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [pick, setPick] = useState("");
  return (
    <div className="p-5">
      <div className="flex gap-2">
        <ASelect value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1">
          <option value="">Select a city…</option>
          {PK_CITIES.filter((c) => !value.includes(c)).map((c) => <option key={c}>{c}</option>)}
        </ASelect>
        <AButton variant="subtle" disabled={!pick} onClick={() => { onChange([...value, pick]); setPick(""); }}><Plus /> Add</AButton>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {value.length === 0 && <p className="text-sm text-muted-foreground">Delivering to all cities.</p>}
        {value.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {c} <button onClick={() => onChange(value.filter((x) => x !== c))} aria-label={`Remove ${c}`}><X className="size-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function BannerEditor({ b, index, last, onChange, onRemove, onMove }: { b: HeroBanner; index: number; last: boolean; onChange: (b: HeroBanner) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div>
        <SingleImage value={b.image ? { url: b.image, publicId: "" } : null} onChange={(v) => onChange({ ...b, image: v?.url ?? "" })} folder="banners" aspect="aspect-[2/1]" label="Upload banner image" />
        <div className="mt-2 flex items-center gap-1">
          <span className="mr-auto text-xs font-semibold text-muted-foreground">Slide {index + 1}</span>
          <AButton size="icon-sm" variant="ghost" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></AButton>
          <AButton size="icon-sm" variant="ghost" aria-label="Move down" disabled={last} onClick={() => onMove(1)}><ArrowDown /></AButton>
          <AButton size="icon-sm" variant="ghost" aria-label="Remove banner" className="text-sale" onClick={onRemove}><Trash2 /></AButton>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AField label="Small heading (eyebrow)"><AInput value={b.eyebrow ?? ""} onChange={(e) => onChange({ ...b, eyebrow: e.target.value })} placeholder="Winter Festive '26" /></AField>
        <AField label="Title"><AInput value={b.title} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="Grace, woven by hand" /></AField>
        <AField label="Subtitle" className="sm:col-span-2"><ATextarea value={b.subtitle} onChange={(e) => onChange({ ...b, subtitle: e.target.value })} className="min-h-14" /></AField>
        <AField label="Button text"><AInput value={b.ctaLabel} onChange={(e) => onChange({ ...b, ctaLabel: e.target.value })} /></AField>
        <AField label="Button link" hint="e.g. /shop or /category/men"><AInput value={b.ctaLink} onChange={(e) => onChange({ ...b, ctaLink: e.target.value })} /></AField>
      </div>
    </div>
  );
}

function EmailTemplates({ value, onChange }: { value: StoreSettings["templates"]["email"]; onChange: (v: StoreSettings["templates"]["email"]) => void }) {
  const [st, setSt] = useState<OrderStatus>("confirmed");
  const cur = value[st] ?? { subject: "", body: "" };
  return (
    <div className="space-y-3 p-5">
      <ASelect value={st} onChange={(e) => setSt(e.target.value as OrderStatus)} className="w-56">
        {ORDER_STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABELS[x]}</option>)}
      </ASelect>
      <AField label="Subject"><AInput value={cur.subject} onChange={(e) => onChange({ ...value, [st]: { ...cur, subject: e.target.value } })} placeholder="Your order {orderNumber} is confirmed" /></AField>
      <AField label="Message" hint={`Placeholders: ${TEMPLATE_TOKENS.join(" ")}`}><ATextarea value={cur.body} onChange={(e) => onChange({ ...value, [st]: { ...cur, body: e.target.value } })} className="min-h-32" placeholder={"Hi {name},\n\nGreat news — your order {orderNumber} is confirmed."} /></AField>
    </div>
  );
}
