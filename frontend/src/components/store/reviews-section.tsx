"use client";
import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, MessageSquarePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/radix";
import { Rating } from "@/components/ui/misc";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Review } from "@/lib/types";

export function ReviewsSection({ productId, productSlug, reviews, rating, count }: { productId: string; productSlug: string; reviews: Review[]; rating: number; count: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(4);
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
  const total = Math.max(1, reviews.length);

  return (
    <section id="reviews" className="container-x scroll-mt-28 border-t border-border py-16 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[340px_1fr]">
        <div>
          <p className="eyebrow mb-3 text-accent">Reviews</p>
          <h2 className="text-[34px] font-medium leading-none md:text-[44px]">Customer love</h2>
          <div className="mt-6 flex items-end gap-4">
            <span className="font-display text-6xl leading-none">{rating.toFixed(1)}</span>
            <div className="pb-1">
              <Rating value={rating} size={16} />
              <p className="mt-1 text-sm text-muted-foreground">Based on {count} reviews</p>
            </div>
          </div>
          <ul className="mt-6 space-y-2">
            {dist.map(({ s, n }) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="flex w-8 items-center gap-0.5 tabular-nums">{s}<Star className="size-3 fill-accent text-accent" /></span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-accent" style={{ width: `${(n / total) * 100}%` }} /></span>
                <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
          {user ? (
            <Button variant="outline" className="mt-8 w-full" onClick={() => setOpen(true)}><MessageSquarePlus /> Write a review</Button>
          ) : (
            <Button asChild variant="outline" className="mt-8 w-full"><Link href={`/login?next=/product/${productSlug}%23reviews`}>Log in to write a review</Link></Button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Only customers who purchased this item can leave a verified review.</p>
        </div>
        <div>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.slice(0, shown).map((r) => (
                <li key={r.id} className="py-7 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-muted font-display text-lg">{r.userName[0]}</span>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold">{r.userName}{r.verified && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><BadgeCheck className="size-3.5" /> Verified buyer</span>}</p>
                        <Rating value={r.rating} size={12} />
                      </div>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">{formatDate(r.createdAt)}</time>
                  </div>
                  <p className="mt-4 font-semibold">{r.title}</p>
                  <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
          {shown < reviews.length && <Button variant="subtle" className="mt-4" onClick={() => setShown((v) => v + 4)}>Show more reviews</Button>}
        </div>
      </div>
      <ReviewForm open={open} onOpenChange={setOpen} productId={productId} />
    </section>
  );
}

function ReviewForm({ open, onOpenChange, productId }: { open: boolean; onOpenChange: (v: boolean) => void; productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Please add a short title and at least 10 characters of feedback.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/reviews", { productId, rating, title: title.trim(), body: body.trim() }, { silentDemo: true });
      toast.success("Thank you for your review!", { description: "It will appear once approved by our team." });
      onOpenChange(false);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit review");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Write a review">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your rating</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} stars`} onClick={() => setRating(s)}>
                <Star className={cn("size-8 transition", s <= rating ? "fill-accent text-accent" : "text-border")} strokeWidth={1.2} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Title" htmlFor="rv-title"><Input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Sum it up in a few words" /></Field>
        <Field label="Your review" htmlFor="rv-body"><Textarea id="rv-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="How was the fit, fabric and quality?" /></Field>
        <Button type="submit" className="w-full" loading={loading}>Submit review</Button>
      </form>
    </Modal>
  );
}
