"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/radix";
import { DemoNotice, Divider, GoogleButton, PasswordInput } from "@/components/store/auth-ui";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";
import { loginSchema } from "@/lib/validation";
import { safeNext } from "@/lib/utils";

type Values = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const { user, loading, signIn, signInWithGoogle, demoMode } = useAuth();
  const [gLoading, setGLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });

  // already logged in (persistent session) → go straight on
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, next, router]);

  const onSubmit = async (v: Values) => {
    try {
      await signIn(v.email, v.password, v.remember);
      toast.success("Welcome back!");
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };
  const google = async () => {
    setGLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <>
      <p className="eyebrow mb-3 text-accent">Welcome back</p>
      <h1 className="text-[42px] font-medium leading-none">Log in</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">Sign in to track orders, save addresses and check out faster.</p>
      {demoMode && <DemoNotice />}
      <GoogleButton onClick={google} loading={gLoading} />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} invalid={!!errors.password} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2.5">
            <Checkbox checked={watch("remember")} onCheckedChange={(v) => setValue("remember", !!v)} /> Keep me logged in
          </label>
          <Link href="/forgot-password" className="font-semibold underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Log in</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to AH Clothing Hub? <Link href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-foreground underline underline-offset-4">Create an account</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
