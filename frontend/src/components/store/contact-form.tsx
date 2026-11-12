"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { contactSchema } from "@/lib/validation";
import { api } from "@/lib/api";

type Values = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { phone: "" } });
  const onSubmit = async (v: Values) => {
    try {
      await api.post("/api/contact", v, { silentDemo: true });
      setSent(true);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send your message. Please try WhatsApp instead.");
    }
  };
  if (sent)
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" strokeWidth={1.4} />
        <h3 className="mt-4 text-2xl">Message sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">Thank you! We&apos;ll get back to you soon.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Send another</Button>
      </div>
    );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Name" htmlFor="c-name" error={errors.name?.message}><Input id="c-name" autoComplete="name" {...register("name")} invalid={!!errors.name} /></Field>
      <Field label="Phone (optional)" htmlFor="c-phone" error={errors.phone?.message}><Input id="c-phone" type="tel" placeholder="03XX XXXXXXX" {...register("phone")} invalid={!!errors.phone} /></Field>
      <Field label="Email" htmlFor="c-email" error={errors.email?.message} className="sm:col-span-2"><Input id="c-email" type="email" autoComplete="email" {...register("email")} invalid={!!errors.email} /></Field>
      <Field label="Subject" htmlFor="c-subject" error={errors.subject?.message} className="sm:col-span-2"><Input id="c-subject" placeholder="Order, sizing, collaboration…" {...register("subject")} invalid={!!errors.subject} /></Field>
      <Field label="Message" htmlFor="c-msg" error={errors.message?.message} className="sm:col-span-2"><Textarea id="c-msg" rows={5} {...register("message")} invalid={!!errors.message} /></Field>
      <div className="sm:col-span-2"><Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">Send message</Button></div>
    </form>
  );
}
