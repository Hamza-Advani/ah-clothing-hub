"use client";
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Modal } from "@/components/ui/radix";
import { AButton, AField, AInput, ATextarea } from "./ui";
import { adminApi, run } from "@/lib/admin/actions";
import { whatsappLink } from "@/lib/utils";

export function EmailDialog({
  open,
  onOpenChange,
  to,
  name,
  subject = "",
  message = "",
  messageId,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  to: string;
  name: string;
  subject?: string;
  message?: string;
  messageId?: string;
  onSent?: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Send email" description={`To ${name} <${to}> · sent via Resend with your store branding`} className="max-w-xl">
      {open && <EmailForm to={to} name={name} subject={subject} message={message} messageId={messageId} onDone={() => { onOpenChange(false); onSent?.(); }} />}
    </Modal>
  );
}

function EmailForm({ to, name, subject: s0, message: m0, messageId, onDone }: { to: string; name: string; subject: string; message: string; messageId?: string; onDone: () => void }) {
  const [subject, setSubject] = useState(s0);
  const [message, setMessage] = useState(m0);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const r = await run(adminApi.email({ to, name, subject, message, messageId }), "Email sent");
    setBusy(false);
    if (r) onDone();
  };
  return (
    <div className="space-y-4">
      <AField label="Subject" htmlFor="em-subject">
        <AInput id="em-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
      </AField>
      <AField label="Message" htmlFor="em-msg" hint="Plain text — line breaks are kept.">
        <ATextarea id="em-msg" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-44" placeholder={`Hi ${name.split(" ")[0]},`} />
      </AField>
      <div className="flex justify-end">
        <AButton onClick={send} loading={busy} disabled={subject.trim().length < 2 || message.trim().length < 2}>
          <Send /> Send email
        </AButton>
      </div>
    </div>
  );
}

export function WhatsAppDialog({ open, onOpenChange, phone, name, text }: { open: boolean; onOpenChange: (v: boolean) => void; phone: string; name: string; text: string }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Send WhatsApp" description={`To ${name} · ${phone}. Edit the message, then open WhatsApp.`} className="max-w-xl">
      {open && <WaForm phone={phone} text={text} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function WaForm({ phone, text, onDone }: { phone: string; text: string; onDone: () => void }) {
  const [msg, setMsg] = useState(text);
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "92" + digits.slice(1) : digits;
  return (
    <div className="space-y-4">
      <ATextarea value={msg} onChange={(e) => setMsg(e.target.value)} className="min-h-36" aria-label="WhatsApp message" />
      <div className="flex justify-end">
        <AButton asChild className="bg-[#1f9d55] text-white hover:bg-[#1a8a4a]">
          <a href={whatsappLink(intl, msg)} target="_blank" rel="noreferrer" onClick={onDone}>
            <MessageCircle /> Open WhatsApp
          </a>
        </AButton>
      </div>
    </div>
  );
}
