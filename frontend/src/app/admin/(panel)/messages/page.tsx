"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, Inbox, Mail, MailOpen, MessageCircle, Phone, Reply, Trash2 } from "lucide-react";
import { useAdminData } from "@/components/admin/admin-data";
import { AButton, Card, ConfirmDialog, dateTime, EmptyBlock, PageHeader, SearchBox, Segmented, timeAgo } from "@/components/admin/ui";
import { EmailDialog, WhatsAppDialog } from "@/components/admin/comm-dialogs";
import { adminApi, run } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread" | "replied";

export default function MessagesPage() {
  const { messages } = useAdminData();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState(false);
  const [wa, setWa] = useState(false);
  const [del, setDel] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (messages ?? []).filter((m) => (tab === "all" || (tab === "unread" ? !m.read : !!m.repliedAt)) && (!s || m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.subject.toLowerCase().includes(s) || m.message.toLowerCase().includes(s)));
  }, [messages, tab, q]);
  const cur = (messages ?? []).find((m) => m.id === openId) ?? null;
  const unread = (messages ?? []).filter((m) => !m.read).length;

  const open = (id: string) => {
    setOpenId(id);
    const m = messages?.find((x) => x.id === id);
    if (m && !m.read) adminApi.messageRead(id, true).catch(() => {});
  };

  return (
    <>
      <PageHeader title="Messages" description={`Contact form inbox · ${unread} unread`} />
      <Card className="grid min-h-[560px] overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className={cn("flex flex-col border-border lg:border-r", cur && "hidden lg:flex")}>
          <div className="space-y-2 border-b border-border p-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search messages" />
            <Segmented value={tab} onChange={setTab} options={[{ value: "all", label: "All" }, { value: "unread", label: `Unread (${unread})` }, { value: "replied", label: "Replied" }]} />
          </div>
          {!messages ? (
            <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
          ) : list.length === 0 ? (
            <EmptyBlock icon={Inbox} title="Inbox is empty" description="Messages from your Contact page appear here." />
          ) : (
            <ul className="flex-1 divide-y divide-border overflow-y-auto">
              {list.map((m) => (
                <li key={m.id}>
                  <button onClick={() => open(m.id)} className={cn("flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-muted/60", openId === m.id && "bg-muted")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.read ? "bg-transparent" : "bg-accent")} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-[13.5px]", !m.read ? "font-bold" : "font-medium")}>{m.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(m.createdAt)}</span>
                      </span>
                      <span className={cn("block truncate text-[13px]", !m.read ? "font-semibold" : "text-foreground/80")}>{m.subject}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cn("flex-col", cur ? "flex" : "hidden lg:flex")}>
          {!cur ? (
            <div className="grid flex-1 place-items-center"><EmptyBlock icon={Mail} title="Select a message" description="Pick a message from the list to read and reply." /></div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <AButton size="icon-sm" variant="ghost" className="lg:hidden" onClick={() => setOpenId(null)} aria-label="Back"><ArrowLeft /></AButton>
                <span className="flex-1" />
                <AButton size="sm" onClick={() => setReply(true)}><Reply /> Reply by email</AButton>
                {cur.phone && <AButton size="sm" variant="subtle" onClick={() => setWa(true)}><MessageCircle /> WhatsApp</AButton>}
                <AButton size="sm" variant="ghost" onClick={() => run(adminApi.messageRead(cur.id, !cur.read), cur.read ? "Marked unread" : "Marked read")}>{cur.read ? <><Mail /> Mark unread</> : <><MailOpen /> Mark read</>}</AButton>
                <AButton size="icon-sm" variant="ghost" className="text-sale" aria-label="Delete" onClick={() => setDel(true)}><Trash2 /></AButton>
              </div>
              <article className="flex-1 overflow-y-auto p-6">
                <h2 className="text-xl font-bold">{cur.subject}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{cur.name}</span>
                  <a href={`mailto:${cur.email}`} className="hover:underline">{cur.email}</a>
                  {cur.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {cur.phone}</span>}
                  <span>{dateTime(cur.createdAt)}</span>
                </div>
                <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">{cur.message}</p>
                {cur.repliedAt && <p className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-xs font-semibold text-success"><Reply className="size-3.5" /> Replied {timeAgo(cur.repliedAt)}</p>}
              </article>
            </>
          )}
        </div>
      </Card>

      {cur && (
        <>
          <EmailDialog open={reply} onOpenChange={setReply} to={cur.email} name={cur.name} subject={`Re: ${cur.subject}`} message={`Hi ${cur.name.split(" ")[0]},\n\nThank you for reaching out to AH Clothing Hub.\n\n\n\n— On ${dateTime(cur.createdAt)} you wrote:\n${cur.message}`} messageId={cur.id} />
          {cur.phone && <WhatsAppDialog open={wa} onOpenChange={setWa} phone={cur.phone} name={cur.name} text={`Assalam o Alaikum ${cur.name.split(" ")[0]}! Thank you for your message about "${cur.subject}". `} />}
          <ConfirmDialog open={del} onOpenChange={setDel} title="Delete this message?" confirmLabel="Delete" destructive onConfirm={async () => { const ok = await run(adminApi.deleteMessage(cur.id), "Message deleted"); if (ok) setOpenId(null); }} />
        </>
      )}
    </>
  );
}
