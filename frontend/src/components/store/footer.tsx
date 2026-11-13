import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter";
import type { Category, StoreSettings } from "@/lib/types";

function Social({ href, label, path }: { href?: string; label: string; path: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/15 transition hover:border-accent hover:text-accent">
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

const ICONS = {
  instagram: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.3a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.4a2.9 2.9 0 110-5.8 2.9 2.9 0 010 5.8zm5.7-7.6a1.1 1.1 0 11-2.1 0 1.1 1.1 0 012.1 0z",
  facebook: "M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V21h3.4z",
  tiktok: "M16.6 5.8A4.3 4.3 0 0115.6 3h-3.1v12.4a2.6 2.6 0 11-1.8-2.5V9.7a5.8 5.8 0 104.9 5.7V9.1a7.4 7.4 0 004.3 1.4V7.4a4.3 4.3 0 01-3.3-1.6z",
  youtube: "M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3L10 15z",
};

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const cols = [
    { title: "Shop", links: [["New arrivals", "/shop?filter=new"], ...categories.map((c) => [c.name, `/category/${c.slug}`]), ["Sale", "/shop?filter=sale"]] },
    { title: "Help", links: [["Track order", "/account/orders"], ["Returns & exchange", "/returns"], ["FAQ", "/faq"], ["Contact us", "/contact"]] },
    { title: "Company", links: [["About us", "/about"], ["Privacy policy", "/privacy"], ["Terms & conditions", "/terms"]] },
  ];
  return (
    <footer className="bg-[#141414] text-[#e9e4dc]">
      <div className="container-x grid gap-12 py-16 md:py-20 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo inverted logoUrl={settings.logo} />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#a8a29b]">{settings.tagline}. Delivered with care to every city in Pakistan.</p>
          <div className="mt-8 max-w-sm">
            <p className="eyebrow mb-3 text-accent">Join the list</p>
            <NewsletterForm dark />
          </div>
          <div className="mt-8 flex gap-2">
            <Social href={settings.socials.instagram} label="Instagram" path={ICONS.instagram} />
            <Social href={settings.socials.facebook} label="Facebook" path={ICONS.facebook} />
            <Social href={settings.socials.tiktok} label="TikTok" path={ICONS.tiktok} />
            <Social href={settings.socials.youtube} label="YouTube" path={ICONS.youtube} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-5 text-[#8f8982]">{c.title}</p>
              <ul className="space-y-3 text-sm">
                {c.links.map(([l, h]) => (
                  <li key={h}>
                    <Link href={h} className="link-underline text-[#e9e4dc]/90 hover:text-white">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <p className="eyebrow mb-5 text-[#8f8982]">Visit / Call</p>
            <ul className="space-y-3 text-sm text-[#e9e4dc]/90">
              {settings.address && <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" />{settings.address}</li>}
              {settings.phone && <li><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-white"><Phone className="mt-0.5 size-4 shrink-0 text-accent" />{settings.phone}</a></li>}
              {settings.email && <li><a href={`mailto:${settings.email}`} className="flex gap-2.5 break-all hover:text-white"><Mail className="mt-0.5 size-4 shrink-0 text-accent" />{settings.email}</a></li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-[#8f8982] md:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Cash on Delivery", "JazzCash", "EasyPaisa"].map((m) => (
              <span key={m} className="rounded-[3px] border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9c2b8]">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
