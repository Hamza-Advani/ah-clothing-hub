"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput, PasswordStrength } from "@/components/store/auth-ui";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";
import { changePasswordSchema } from "@/lib/validation";

type Values = z.infer<typeof changePasswordSchema>;

export default function SecurityPage() {
  const { user, changePassword, resetPassword, demoMode } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(changePasswordSchema) });
  const googleOnly = !!user && !user.providers.includes("password") && user.providers.includes("google.com");

  const submit = async (v: Values) => {
    try {
      await changePassword(v.current, v.password);
      reset({ current: "", password: "", confirm: "" });
      toast.success(demoMode ? "Password updated (demo)" : "Password changed successfully");
    } catch (e) {
      toast.error(authErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Password & security</h2>
      {googleOnly ? (
        <div className="rounded-[6px] border border-border bg-surface p-6">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-success" /><p className="font-semibold">You sign in with Google</p></div>
          <p className="mt-2 text-sm text-muted-foreground">Your password is managed by your Google account. Want to also log in with email & password? We can email you a link to set one.</p>
          <Button variant="outline" className="mt-5" onClick={async () => { await resetPassword(user!.email); toast.success("Check your email for a link to set your password"); }}>Email me a link</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="max-w-md space-y-5 rounded-[6px] border border-border bg-surface p-6 md:p-8" noValidate>
          <Field label="Current password" htmlFor="cur" error={errors.current?.message}><PasswordInput id="cur" autoComplete="current-password" {...register("current")} invalid={!!errors.current} /></Field>
          <Field label="New password" htmlFor="np" error={errors.password?.message}>
            <PasswordInput id="np" autoComplete="new-password" {...register("password")} invalid={!!errors.password} />
            <PasswordStrength value={watch("password") ?? ""} />
          </Field>
          <Field label="Confirm new password" htmlFor="cp" error={errors.confirm?.message}><PasswordInput id="cp" autoComplete="new-password" {...register("confirm")} invalid={!!errors.confirm} /></Field>
          <Button type="submit" loading={isSubmitting}>Update password</Button>
          <p className="text-xs text-muted-foreground">Forgot your current password? <Link href="/forgot-password" className="font-semibold text-foreground underline">Reset it by email</Link></p>
        </form>
      )}
      <div className="rounded-[6px] border border-border bg-surface p-6 text-sm">
        <p className="font-semibold">Stay signed in</p>
        <p className="mt-1 text-muted-foreground">You stay logged in on this device until you log out. On a shared computer, untick “Keep me logged in” when signing in.</p>
      </div>
    </div>
  );
}
