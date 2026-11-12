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
import { DemoNotice, Divider, GoogleButton, PasswordInput, PasswordStrength } from "@/components/store/auth-ui";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";
import { signupSchema } from "@/lib/validation";
import { safeNext } from "@/lib/utils";

type Values = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const { user, loading, signUp, signInWithGoogle, demoMode } = useAuth();
  const [gLoading, setGLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(signupSchema), defaultValues: { terms: false, phone: "" } });

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, next, router]);

  const onSubmit = async (v: Values) => {
    try {
      await signUp(v.name, v.email, v.password, v.phone || undefined);
      toast.success("Account created — welcome to AH Clothing Hub!");
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };
  const google = async () => {
    setGLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setGLoading(false);
    }
  };

  return (
    <>
      <p className="eyebrow mb-3 text-accent">Join the AH Circle</p>
      <h1 className="text-[42px] font-medium leading-none">Create account</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">It takes less than a minute. Once you sign up, you&apos;ll stay logged in on this device.</p>
      {demoMode && <DemoNotice />}
      <GoogleButton onClick={google} loading={gLoading} label="Sign up with Google" />
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}><Input id="name" autoComplete="name" {...register("name")} invalid={!!errors.name} /></Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" autoComplete="email" {...register("email")} invalid={!!errors.email} /></Field>
        <Field label="Mobile (optional)" htmlFor="phone" error={errors.phone?.message}><Input id="phone" type="tel" inputMode="tel" placeholder="03XX XXXXXXX" {...register("phone")} invalid={!!errors.phone} /></Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...register("password")} invalid={!!errors.password} />
          <PasswordStrength value={watch("password") ?? ""} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}><PasswordInput id="confirm" autoComplete="new-password" {...register("confirm")} invalid={!!errors.confirm} /></Field>
        <div>
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Checkbox className="mt-0.5" checked={watch("terms")} onCheckedChange={(v) => setValue("terms", !!v, { shouldValidate: true })} />
            <span>I agree to the <Link href="/terms" className="text-foreground underline">Terms</Link> and <Link href="/privacy" className="text-foreground underline">Privacy Policy</Link>.</span>
          </label>
          {errors.terms && <p className="mt-1.5 text-xs font-medium text-sale">{errors.terms.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">Log in</Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
