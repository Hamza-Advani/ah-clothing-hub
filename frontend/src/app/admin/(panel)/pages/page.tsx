"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { AButton, AField, AInput, ATextarea, Card, CardHeader, FullLoader, PageHeader, Segmented } from "@/components/admin/ui";
import { RichText } from "@/components/admin/rich-text";
import { useLiveDoc } from "@/lib/admin/live";
import { demo } from "@/lib/admin/demo";
import { adminApi, run } from "@/lib/admin/actions";
import { DEFAULT_PAGES } from "@/lib/defaults";
import type { PagesContent } from "@/lib/types";

type Key = "about" | "returns" | "privacy" | "terms" | "faq";
const META: Record<Key, { label: string; href: string }> = {
  about: { label: "About us", href: "/about" },
  returns: { label: "Returns & exchange", href: "/returns" },
  privacy: { label: "Privacy policy", href: "/privacy" },
  terms: { label: "Terms", href: "/terms" },
  faq: { label: "FAQ", href: "/faq" },
};

export default function PagesEditor() {
  const doc = useLiveDoc<PagesContent>("settings/pages", demo.pages);
  if (doc === undefined) return <FullLoader label="Loading pages…" />;
  return <Editor initial={{ ...DEFAULT_PAGES, ...(doc ?? {}) }} />;
}

function Editor({ initial }: { initial: PagesContent }) {
  const [p, setP] = useState<PagesContent>(initial);
  const [tab, setTab] = useState<Key>("about");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const up = (patch: Partial<PagesContent>) => {
    setP((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    const ok = await run(adminApi.saveSettings("pages", { about: p.about, returns: p.returns, privacy: p.privacy, terms: p.terms, faq: p.faq.filter((f) => f.q.trim() && f.a.trim()) }), "Pages saved — live on your store within a minute");
    setSaving(false);
    if (ok) setDirty(false);
  };
  const moveFaq = (i: number, d: -1 | 1) => {
    const n = [...p.faq];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    up({ faq: n });
  };

  return (
    <>
      <PageHeader title="Pages & FAQ" description="Edit the content of your store's information pages." actions={<AButton onClick={save} loading={saving} disabled={!dirty}><Save /> {dirty ? "Save changes" : "Saved"}</AButton>} />
      <Segmented className="mb-5" value={tab} onChange={setTab} options={(Object.keys(META) as Key[]).map((k) => ({ value: k, label: META[k].label }))} />
      <Card>
        <CardHeader
          title={META[tab].label}
          description={tab === "faq" ? "Questions appear as an accordion on the FAQ page (and in Google results)." : "Use headings and bullet lists to keep it easy to read."}
          action={<a href={META[tab].href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">View page <ExternalLink className="size-3" /></a>}
        />
        <div className="p-5">
          {tab !== "faq" ? (
            <RichText key={tab} value={p[tab]} onChange={(v) => up({ [tab]: v } as Partial<PagesContent>)} minHeight={360} />
          ) : (
            <div className="space-y-3">
              {p.faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <AField label="Question"><AInput value={f.q} onChange={(e) => up({ faq: p.faq.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)) })} /></AField>
                      <AField label="Answer"><ATextarea value={f.a} onChange={(e) => up({ faq: p.faq.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)) })} className="min-h-16" /></AField>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <AButton size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => moveFaq(i, -1)}><ArrowUp /></AButton>
                      <AButton size="icon-sm" variant="ghost" aria-label="Move down" disabled={i === p.faq.length - 1} onClick={() => moveFaq(i, 1)}><ArrowDown /></AButton>
                      <AButton size="icon-sm" variant="ghost" aria-label="Delete question" className="text-sale" onClick={() => up({ faq: p.faq.filter((_, k) => k !== i) })}><Trash2 /></AButton>
                    </div>
                  </div>
                </div>
              ))}
              <AButton variant="subtle" onClick={() => up({ faq: [...p.faq, { q: "", a: "" }] })}><Plus /> Add question</AButton>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
