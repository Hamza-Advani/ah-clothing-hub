"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const emailSchema = z.string().email();

export function NewsletterForm({ dark }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) {
      toast.error("Please enter a valid email address");
      return;
    }
    setState("loading");
    try {
      await api.post("/api/newsletter", { email }, { silentDemo: true });
      setState("done");
      toast.success("Welcome to the list!", { description: "Look out for early access & exclusive offers." });
    } catch {
      setState("idle");
      toast.error("Couldn't subscribe right now. Please try again.");
    }
  };
  return (
    <form onSubmit={submit} className={cn("flex h-12 items-center border-b", dark ? "border-white/30" : "border-foreground")}>
      <label htmlFor={dark ? "nl-footer" : "nl-home"} className="sr-only">Email address</label>
      <input
        id={dark ? "nl-footer" : "nl-home"}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className={cn("h-full flex-1 bg-transparent text-sm outline-none", dark ? "placeholder:text-white/40" : "placeholder:text-muted-foreground")}
        disabled={state === "done"}
      />
      <button type="submit" disabled={state !== "idle"} className="grid size-10 place-items-center transition hover:translate-x-0.5" aria-label="Subscribe">
        {state === "done" ? <Check className="size-5 text-success" /> : state === "loading" ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <ArrowRight className="size-5" />}
      </button>
    </form>
  );
}
