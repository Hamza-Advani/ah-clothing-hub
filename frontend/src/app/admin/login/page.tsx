"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, Lock, Package, ShieldAlert, ShoppingBag } from "lucide-react";
import { Divider, GoogleButton, PasswordInput } from "@/components/store/auth-ui";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";
import { AButton, AField, AInput } from "@/components/admin/ui";
import { Checkbox } from "@/components/ui/radix";
import { safeNext } from "@/lib/utils";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address"), password: z.string().min(1, "Enter your password"), remember: z.boolean().optional() });
type Values = z.infer<typeof schema>;

function AdminLoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"), "/admin");
  const { user, loading, isStaff, signIn, signInWithGoogle, signOut, refreshClaims, demoMode, resetPassword } = useAuth();
  const [gLoading, setGLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  // Signed in already (persistent session)? → check role and continue.
  useEffect(() => {
    if (loading || !user) return;
    if (isStaff || demoMode) {
      router.replace(next);
      return;
    }
    let active = true;
    refreshClaims()
      .then((r) => {
        if (!active) return;
        if (r === "admin" || r === "staff") router.replace(next);
        else setDenied(true);
      })
      .catch(() => active && setDenied(true));
    return () => {
      active = false;
    };
  }, [user, loading, isStaff, demoMode, next, router, refreshClaims]);

  const onSubmit = async (v: Values) => {
    try {
      await signIn(v.email, v.password, v.remember);
      if (demoMode) router.replace(next);
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };

  const google = async () => {
    setGLoading(true);
    try {
      await signInWithGoogle();
      if (demoMode) router.replace(next);
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setGLoading(false);
    }
  };

  const forgot = async () => {
    const email = getValues("email");
    if (!z.string().email().safeParse(email).success) return toast.error("Type your email above first, then click “Forgot password”.");
    try {
      await resetPassword(email);
      toast.success("Password reset link sent", { description: `Check the inbox of ${email}` });
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };

  if (denied && user)
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sale/10 text-sale">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">No admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <b className="text-foreground">{user.email}</b> is not an admin or staff account. Ask the store owner to add you under <i>Team & roles</i>.
        </p>
        <AButton
          className="mt-6 w-full"
          onClick={async () => {
            await signOut();
            setDenied(false);
          }}
        >
          Use another account
        </AButton>
      </div>
    );

  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald dark:text-[#6fb7a3]">
        <Lock className="size-3.5" /> Secure admin area
      </span>
      <h1 className="mt-4 text-[30px] font-bold leading-tight tracking-tight">Sign in to Admin</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Manage orders, products, customers and your store settings.</p>
      {demoMode && <p className="mt-4 rounded-lg bg-warning/12 px-3 py-2 text-xs font-medium text-warning">Demo mode — any email/password opens the panel with sample data.</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <AField label="Email" htmlFor="email" error={errors.email?.message}>
          <AInput id="email" type="email" autoComplete="email" placeholder="you@email.com" className="h-11" invalid={!!errors.email} {...register("email")} />
        </AField>
        <AField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" className="h-11 rounded-lg text-sm" invalid={!!errors.password} {...register("password")} />
        </AField>
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <Checkbox checked={watch("remember")} onCheckedChange={(v) => setValue("remember", v === true)} /> Keep me signed in
          </label>
          <button type="button" onClick={forgot} className="text-[13px] font-semibold text-accent hover:underline">
            Forgot password?
          </button>
        </div>
        <AButton type="submit" className="h-11 w-full" loading={isSubmitting || (!!user && !denied)}>
          Sign in
        </AButton>
      </form>
      <Divider />
      <GoogleButton onClick={google} loading={gLoading} />
      <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to store
      </Link>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="admin-skin grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#13211d] p-12 text-[#f2efea] lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #b08d57 0, transparent 45%), radial-gradient(circle at 80% 90%, #3f7a6b 0, transparent 50%)" }} aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl border border-[#b08d57]/60 font-display text-xl font-semibold">AH</span>
          <span>
            <span className="block text-[17px] font-bold">AH Clothing Hub</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a46a]">Admin console</span>
          </span>
        </div>
        <div className="relative mt-auto max-w-md">
          <p className="font-display text-[44px] italic leading-[1.05]">Run your store with calm confidence.</p>
          <ul className="mt-8 space-y-4 text-sm text-[#d8d2c8]">
            {[
              { icon: ShoppingBag, t: "Live orders with instant alerts" },
              { icon: BarChart3, t: "Sales, profit & customer analytics" },
              { icon: Package, t: "Products, stock and images in one place" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-white/8">
                  <x.icon className="size-4 text-[#c9a46a]" />
                </span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-[#9a958f]">© {new Date().getFullYear()} AH Clothing Hub · Authorised staff only</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
