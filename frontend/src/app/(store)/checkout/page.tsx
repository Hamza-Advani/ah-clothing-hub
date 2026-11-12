"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Check, ChevronDown, Copy, ImagePlus, Lock, ShieldCheck, ShoppingBag, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/radix";
import { EmptyState } from "@/components/ui/misc";
import { CouponInput, TotalsRows } from "@/components/store/order-summary";
import { useStoreData } from "@/components/providers/store-data";
import { useAuth } from "@/components/providers/auth-provider";
import { cartSubtotal, useCart } from "@/store/cart";
import { useMounted } from "@/hooks/use-mounted";
import { checkoutSchema, type CheckoutValues } from "@/lib/validation";
import { previewTotals } from "@/lib/pricing";
import { PK_CITIES } from "@/lib/constants";
import { api, isApiConfigured } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { cn, formatPKR } from "@/lib/utils";

type PlacedOrder = { orderId: string; orderNumber: string };

export default function CheckoutPage() {
  const mounted = useMounted();
  const router = useRouter();
  const { settings } = useStoreData();
  const { user, profile } = useAuth();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const coupon = useCart((s) => s.coupon);
  const setCoupon = useCart((s) => s.setCoupon);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod", city: "", saveAddress: true },
  });
  const method = watch("paymentMethod");

  // prefill from account
  useEffect(() => {
    if (!user) return;
    const addr = profile?.addresses.find((a) => a.isDefault) ?? profile?.addresses[0];
    setValue("email", user.email);
    setValue("name", addr?.name ?? profile?.name ?? user.name);
    if (addr?.phone || profile?.phone) setValue("phone", addr?.phone ?? profile?.phone ?? "");
    if (addr) {
      setValue("address", addr.address);
      setValue("city", addr.city);
    }
  }, [user, profile, setValue]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (!mounted) return <div className="container-x min-h-[70vh] py-16"><div className="skeleton h-10 w-56" /></div>;
  if (items.length === 0)
    return <EmptyState className="min-h-[60vh]" icon={ShoppingBag} title="Your bag is empty" description="Add a few favourites before checking out." action={<Button asChild size="lg"><Link href="/shop">Shop now</Link></Button>} />;

  const totals = previewTotals(cartSubtotal(items), { deliveryCharge: settings.deliveryCharge, freeDeliveryThreshold: settings.freeDeliveryThreshold, coupon });
  const manual = method === "jazzcash" || method === "easypaisa" ? settings.payments[method] : null;

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image (JPG or PNG).");
    if (f.size > 8 * 1024 * 1024) return toast.error("Image is too large (max 8MB).");
    setScreenshot(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (v: CheckoutValues) => {
    if (manual && !screenshot) {
      toast.error("Please upload your payment screenshot to continue.");
      return;
    }
    setPlacing(true);
    try {
      let shot: { url: string; publicId: string } | null = null;
      if (manual && screenshot) shot = await uploadImage(screenshot, "payments");
      const payload = {
        customer: { name: v.name, phone: v.phone, email: v.email },
        shipping: { address: v.address, city: v.city, notes: v.notes ?? "" },
        items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
        couponCode: coupon?.code ?? null,
        payment: { method: v.paymentMethod, txnId: v.txnId ?? null, screenshot: shot },
        saveAddress: !!user && !!v.saveAddress,
      };
      const res = await api.post<PlacedOrder>("/api/orders", payload, {
        silentDemo: true,
        demoResult: { orderId: "demo", orderNumber: `AH-${String(Date.now()).slice(-6)}` },
      });
      sessionStorage.setItem(
        "ah-last-order",
        JSON.stringify({ ...res, ...payload, items, totals, createdAt: Date.now(), demo: !isApiConfigured }),
      );
      clear();
      router.replace(`/order-success?order=${encodeURIComponent(res.orderNumber)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't place your order. Please try again.");
      setPlacing(false);
    }
  };

  const Summary = (
    <div className="space-y-6">
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4">
            <div className="relative h-20 w-15 shrink-0 overflow-hidden rounded-[4px] bg-muted">
              <Image src={i.image} alt={i.name} fill sizes="60px" className="object-cover" />
              <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-[4px] bg-primary text-[10px] font-bold text-primary-foreground">{i.qty}</span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="line-clamp-1 font-semibold">{i.name}</p>
              <p className="text-xs text-muted-foreground">{i.color} · {i.size}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatPKR((i.salePrice ?? i.price) * i.qty)}</span>
          </li>
        ))}
      </ul>
      <CouponInput subtotal={totals.subtotal} coupon={coupon} onApply={setCoupon} />
      <TotalsRows {...totals} freeDeliveryThreshold={settings.freeDeliveryThreshold} />
    </div>
  );

  return (
    <div className="bg-background">
      {/* mobile summary toggle */}
      <div className="border-b border-border bg-surface lg:hidden">
        <button onClick={() => setSummaryOpen((v) => !v)} className="container-x flex h-14 w-full items-center justify-between text-sm" aria-expanded={summaryOpen}>
          <span className="flex items-center gap-2 font-semibold"><ShoppingBag className="size-4" /> {summaryOpen ? "Hide" : "Show"} order summary <ChevronDown className={cn("size-4 transition", summaryOpen && "rotate-180")} /></span>
          <span className="font-semibold tabular-nums">{formatPKR(totals.total)}</span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="container-x pb-6">{Summary}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container-x grid gap-10 py-8 md:py-12 lg:grid-cols-[1fr_440px] lg:gap-16">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
          <div>
            <h1 className="text-[38px] font-medium leading-none md:text-[48px]">Checkout</h1>
            {!user && (
              <p className="mt-3 text-sm text-muted-foreground">
                Have an account? <Link href="/login?next=/checkout" className="font-semibold text-foreground underline underline-offset-4">Log in</Link> for faster checkout — or continue as guest.
              </p>
            )}
          </div>

          <Step n={1} title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={errors.name?.message}><Input id="name" autoComplete="name" {...register("name")} invalid={!!errors.name} /></Field>
              <Field label="Mobile number" htmlFor="phone" error={errors.phone?.message} hint="For delivery updates & COD confirmation">
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" {...register("phone")} invalid={!!errors.phone} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email?.message} className="sm:col-span-2"><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} invalid={!!errors.email} /></Field>
            </div>
          </Step>

          <Step n={2} title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" htmlFor="address" error={errors.address?.message} className="sm:col-span-2">
                <Input id="address" autoComplete="street-address" placeholder="House #, street, area / sector" {...register("address")} invalid={!!errors.address} />
              </Field>
              <Field label="City" htmlFor="city" error={errors.city?.message}>
                <NativeSelect id="city" {...register("city")} invalid={!!errors.city}>
                  <option value="">Select city</option>
                  {(settings.citiesServed.length ? settings.citiesServed : PK_CITIES).map((c) => <option key={c}>{c}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Order notes (optional)" htmlFor="notes" className="sm:col-span-2">
                <Textarea id="notes" rows={2} className="min-h-20" placeholder="Landmark, preferred delivery time…" {...register("notes")} />
              </Field>
              {user && (
                <label className="flex items-center gap-3 text-sm sm:col-span-2">
                  <Checkbox checked={watch("saveAddress")} onCheckedChange={(v) => setValue("saveAddress", !!v)} /> Save this address to my account
                </label>
              )}
            </div>
          </Step>

          <Step n={3} title="Payment">
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {settings.payments.cod.enabled && (
                <PayOption active={method === "cod"} onClick={() => setValue("paymentMethod", "cod")} icon={<Banknote className="size-5" />} title="Cash on Delivery" text="Pay in cash when your order arrives" badge="Most popular" />
              )}
              {settings.payments.jazzcash.enabled && (
                <PayOption active={method === "jazzcash"} onClick={() => setValue("paymentMethod", "jazzcash")} icon={<Smartphone className="size-5" />} title="JazzCash" text="Send payment & upload screenshot" />
              )}
              {settings.payments.easypaisa.enabled && (
                <PayOption active={method === "easypaisa"} onClick={() => setValue("paymentMethod", "easypaisa")} icon={<Smartphone className="size-5" />} title="EasyPaisa" text="Send payment & upload screenshot" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {manual && (
                <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-4 rounded-[6px] border border-border bg-surface p-5">
                  <p className="text-sm">Send <strong className="tabular-nums">{formatPKR(totals.total)}</strong> to our {method === "jazzcash" ? "JazzCash" : "EasyPaisa"} account:</p>
                  <div className="flex items-center justify-between rounded-[4px] bg-muted px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{manual.accountTitle}</p>
                      <p className="font-semibold tabular-nums tracking-wide">{manual.accountNumber}</p>
                    </div>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(manual.accountNumber.replace(/\s/g, "")); toast.success("Account number copied"); }} className="inline-flex items-center gap-1.5 text-xs font-semibold"><Copy className="size-3.5" /> Copy</button>
                  </div>
                  <Field label="Transaction ID (optional)" htmlFor="txn"><Input id="txn" placeholder="e.g. 0123456789" {...register("txnId")} /></Field>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payment screenshot *</p>
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} aria-label="Upload payment screenshot" />
                    {preview ? (
                      <div className="relative w-40 overflow-hidden rounded-[4px] border border-border">
                        <Image src={preview} alt="Payment screenshot preview" width={160} height={280} className="h-56 w-40 object-cover" unoptimized />
                        <button type="button" onClick={() => { setScreenshot(null); setPreview(null); }} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove screenshot"><X className="size-4" /></button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
                        className="flex w-full flex-col items-center gap-2 rounded-[4px] border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition hover:border-accent hover:text-foreground"
                      >
                        <ImagePlus className="size-6" />
                        Tap to upload or drag & drop
                        <span className="text-xs">JPG / PNG, max 8MB</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">We&apos;ll verify your payment and confirm your order, usually within 1 hour.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Step>

          <div className="space-y-4">
            <Button type="submit" size="lg" className="h-14 w-full text-[13px]" loading={placing}>
              <Lock /> Place order · {formatPKR(totals.total)}
            </Button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" /> Secure checkout · Your details are encrypted and never shared
            </p>
            <p className="text-center text-xs text-muted-foreground">By placing your order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/returns" className="underline">Return policy</Link>.</p>
          </div>
        </form>

        <aside className="hidden h-fit rounded-[6px] border border-border bg-surface p-6 lg:sticky lg:top-28 lg:block">
          <h2 className="mb-6 font-display text-2xl">Order summary</h2>
          {Summary}
        </aside>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-primary font-sans text-xs text-primary-foreground">{n}</span>
        <span className="font-sans">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function PayOption({ active, onClick, icon, title, text, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string; badge?: string }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onClick} className={cn("flex w-full items-center gap-4 rounded-[6px] border bg-surface p-4 text-left transition", active ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40")}>
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2 transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{active && <Check className="size-3" strokeWidth={3} />}</span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-accent">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">{title}{badge && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">{badge}</span>}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
