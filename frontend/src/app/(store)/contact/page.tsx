import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { ContactForm } from "@/components/store/contact-form";
import { getSettings } from "@/lib/catalog";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: "Contact AH Clothing Hub on WhatsApp, phone or email for help with sizing, orders, delivery and exchanges, or send us a message using the contact form.",
  path: "/contact",
});

export default async function ContactPage() {
  const s = await getSettings();
  const cards = [
    { icon: MessageCircle, label: "WhatsApp", value: s.whatsapp, href: whatsappLink(s.whatsapp, "Assalam o Alaikum!"), note: "Fastest reply" },
    { icon: Phone, label: "Call us", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}`, note: "10am – 10pm, Mon–Sat" },
    { icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}`, note: "Reply within 24 hours" },
    { icon: MapPin, label: "Address", value: s.address, href: `https://maps.google.com/?q=${encodeURIComponent(s.address)}`, note: "" },
  ].filter((c) => c.value);
  return (
    <>
      <PageHeader eyebrow="We're here to help" title="Get in touch" description="Questions about sizing, an order, or styling advice? We'd love to hear from you." />
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div className="space-y-4">
          {cards.map(({ icon: I, label, value, href, note }) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex items-start gap-4 rounded-[6px] border border-border bg-surface p-5 transition hover:border-foreground/30 hover:shadow-soft">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-accent transition group-hover:bg-primary group-hover:text-primary-foreground"><I className="size-5" strokeWidth={1.6} /></span>
              <span>
                <span className="eyebrow block text-muted-foreground">{label}</span>
                <span className="mt-1 block break-words font-semibold">{value}</span>
                <span className="block text-xs text-muted-foreground">{note}</span>
              </span>
            </a>
          ))}
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground"><Clock className="size-3.5" /> Customer care hours: Monday – Saturday, 10am – 10pm PKT</p>
        </div>
        <div className="rounded-[6px] border border-border bg-surface p-6 md:p-10">
          <h2 className="text-3xl">Send us a message</h2>
          <p className="mb-8 mt-2 text-sm text-muted-foreground">Fill in the form and our team will get back to you shortly.</p>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
