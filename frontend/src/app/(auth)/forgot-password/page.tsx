"use client";
import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, useAuth } from "@/components/providers/auth-provider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email.trim()).success) return setError("Enter a valid email address");
    setError(undefined);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      // don't reveal whether an account exists
      if ((err as { code?: string }).code === "auth/user-not-found") setSent(true);
      else toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent)
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success"><MailCheck className="size-7" /></div>
        <h1 className="mt-6 text-[38px] font-medium leading-none">Check your inbox</h1>
        <p className="mt-3 text-sm text-muted-foreground">If an account exists for <strong className="text-foreground">{email}</strong>, you&apos;ll receive a link to reset your password in a few minutes. Don&apos;t forget to check spam.</p>
        <Button asChild size="lg" className="mt-8 w-full"><Link href="/login">Back to login</Link></Button>
      </div>
    );

  return (
    <>
      <p className="eyebrow mb-3 text-accent">Account help</p>
      <h1 className="text-[42px] font-medium leading-none">Forgot password?</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">Enter the email you signed up with and we&apos;ll send you a secure reset link.</p>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email" error={error}><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Send reset link</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">Remembered it? <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">Log in</Link></p>
    </>
  );
}
