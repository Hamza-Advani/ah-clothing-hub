"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Check, EyeOff, Star, Trash2 } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, ASelect, Card, ConfirmDialog, EmptyBlock, PageHeader, Pager, SearchBox, Segmented, Thumb, timeAgo, usePaged } from "@/components/admin/ui";
import { Rating } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { adminApi, run } from "@/lib/admin/actions";
import type { Review } from "@/lib/types";

type Tab = "pending" | "approved" | "hidden" | "all";

export default function ReviewsPage() {
  const { reviews, products } = useAdminData();
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [stars, setStars] = useState("all");
  const [del, setDel] = useState<Review | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const prod = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, hidden: 0, all: reviews?.length ?? 0 };
    for (const r of reviews ?? []) c[r.status]++;
    return c;
  }, [reviews]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (reviews ?? []).filter((r) => (tab === "all" || r.status === tab) && (stars === "all" || r.rating === Number(stars)) && (!s || r.userName.toLowerCase().includes(s) || r.title.toLowerCase().includes(s) || r.body.toLowerCase().includes(s) || (prod.get(r.productId)?.name ?? "").toLowerCase().includes(s)));
  }, [reviews, tab, stars, q, prod]);
  const paged = usePaged(list, 15);

  const avg = reviews?.filter((r) => r.status === "approved").reduce((a, r, _, arr) => a + r.rating / arr.length, 0) ?? 0;

  const setStatus = async (r: Review, status: "approved" | "hidden") => {
    setBusy(r.id + status);
    await run(adminApi.reviewStatus(r.id, status), status === "approved" ? "Review published" : "Review hidden");
    setBusy(null);
  };

  return (
    <>
      <PageHeader title="Reviews" description={`Approve reviews before they appear on product pages · store average ${avg ? avg.toFixed(1) : "—"} ★`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={tab} onChange={(v) => { setTab(v); paged.setPage(1); }} options={(["pending", "approved", "hidden", "all"] as Tab[]).map((t) => ({ value: t, label: <span className="capitalize">{t} <span className="ml-1 rounded-full bg-foreground/8 px-1.5 text-[10.5px]">{counts[t]}</span></span> }))} />
        <span className="flex-1" />
        <SearchBox value={q} onChange={setQ} placeholder="Search reviews or products" className="w-full sm:w-64" />
        <ASelect value={stars} onChange={(e) => setStars(e.target.value)} className="w-32" aria-label="Rating">
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </ASelect>
      </div>
      {!reviews ? (
        <Card className="p-5"><div className="skeleton h-40 rounded-lg" /></Card>
      ) : list.length === 0 ? (
        <Card><EmptyBlock icon={Star} title={tab === "pending" ? "No reviews waiting" : "No reviews here"} description={tab === "pending" ? "You're all caught up. New reviews from verified buyers appear here for approval." : undefined} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {paged.slice.map((r) => {
              const p = prod.get(r.productId);
              return (
                <li key={r.id} className="flex flex-col gap-4 p-5 md:flex-row">
                  <Link href={p ? `/admin/products/${p.id}` : "#"} className="flex shrink-0 items-center gap-3 md:w-56">
                    <Thumb src={p?.images[0]?.url} alt={p?.name ?? "Product"} />
                    <span className="line-clamp-2 text-[13px] font-medium">{p?.name ?? "Deleted product"}</span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Rating value={r.rating} />
                      <span className="text-sm font-semibold">{r.title}</span>
                      {r.status === "pending" && <Badge variant="warning" shape="pill">Pending</Badge>}
                      {r.status === "hidden" && <Badge variant="neutral" shape="pill">Hidden</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{r.body}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {r.userName} {r.verified && <span className="inline-flex items-center gap-0.5 text-success"><BadgeCheck className="size-3.5" /> Verified buyer</span>} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1.5">
                    {r.status !== "approved" && <AButton size="sm" className="bg-success text-white hover:bg-success/90" loading={busy === r.id + "approved"} onClick={() => setStatus(r, "approved")}><Check /> Approve</AButton>}
                    {r.status !== "hidden" && <AButton size="sm" variant="subtle" loading={busy === r.id + "hidden"} onClick={() => setStatus(r, "hidden")}><EyeOff /> Hide</AButton>}
                    <AButton size="icon-sm" variant="ghost" className="text-sale" aria-label="Delete review" onClick={() => setDel(r)}><Trash2 /></AButton>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager {...paged} />
        </Card>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Delete this review?" description="The product rating will be recalculated." confirmLabel="Delete" destructive onConfirm={async () => { if (del) await run(adminApi.deleteReview(del.id), "Review deleted"); }} />
    </>
  );
}
