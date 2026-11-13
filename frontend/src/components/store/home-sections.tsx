import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { Reveal } from "./reveal";
import { ProductRail } from "./product-rail";
import { Rating, SectionHeading } from "@/components/ui/misc";
import type { Category, Product } from "@/lib/types";
import { formatPKR } from "@/lib/utils";

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const [first, ...rest] = categories;
  if (!first) return null;
  return (
    <section className="container-x py-16 md:py-24">
      <SectionHeading eyebrow="Shop by category" title="Curated for every moment" href="/shop" linkLabel="All products" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-5">
        {[first, ...rest].slice(0, 5).map((c, i) => (
          <Reveal key={c.id} delay={i * 0.06} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <Link href={`/category/${c.slug}`} className="group relative block h-full overflow-hidden rounded-[6px] bg-muted">
              <div className={i === 0 ? "relative aspect-[4/5] md:aspect-auto md:h-full md:min-h-[640px]" : "relative aspect-[3/4] md:aspect-auto md:h-full md:min-h-[310px]"}>
                <Image src={c.image.url} alt={c.name} fill sizes={i === 0 ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"} className="object-cover transition duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white md:p-6">
                <div>
                  <h3 className={i === 0 ? "text-[34px] font-medium leading-none md:text-[52px]" : "text-[22px] font-medium leading-none md:text-[30px]"}>{c.name}</h3>
                  {c.description && <p className="mt-2 text-xs text-white/80 max-md:hidden md:text-sm">{c.description}</p>}
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/40 transition duration-500 group-hover:border-white group-hover:bg-white group-hover:text-black max-md:size-8">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ProductSection({ eyebrow, title, href, products, muted }: { eyebrow: string; title: string; href: string; products: Product[]; muted?: boolean }) {
  if (!products.length) return null;
  return (
    <section className={muted ? "bg-muted/60 py-16 md:py-24" : "py-16 md:py-24"}>
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} href={href} />
        <ProductRail products={products} />
        <Link href={href} className="mt-8 flex h-12 items-center justify-center border border-foreground text-[12px] font-semibold uppercase tracking-[0.16em] sm:hidden">
          View all
        </Link>
      </div>
    </section>
  );
}

export function EditorialSplit({ image, image2 }: { image: string; image2: string }) {
  return (
    <section className="container-x py-16 md:py-24">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[6px]">
            <Image src={image} alt="Artisan finishing an embroidered piece" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-8 -right-4 hidden w-[42%] overflow-hidden rounded-[6px] border-8 border-background shadow-lift md:block">
            <div className="relative aspect-[3/4]">
              <Image src={image2} alt="Detail of fabric" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow mb-4 text-accent">Our craft</p>
          <h2 className="text-[40px] font-medium leading-[1.02] md:text-[60px]">
            Heritage hands,
            <br />
            <em className="font-normal text-accent">modern</em> silhouettes
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            Classic eastern elegance meets clean, modern cuts — pieces for every day, every celebration and everything in between, delivered across Pakistan.
          </p>
          <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]">
            <span className="link-underline">Our story</span> <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function SaleBanner({ image, maxOff }: { image: string; maxOff: number }) {
  return (
    <section className="container-x py-8 md:py-12">
      <Reveal>
        <Link href="/shop?filter=sale" className="group relative block overflow-hidden rounded-[6px] bg-emerald text-white">
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 flex flex-col justify-center p-8 md:p-16">
              <p className="eyebrow mb-4 text-[#e6d3b0]">Season sale · Limited time</p>
              <h2 className="text-[46px] font-medium leading-[0.95] md:text-[76px]">
                Up to <em className="font-normal text-[#e6d3b0]">{maxOff}%</em> off
              </h2>
              <p className="mt-4 max-w-sm text-white/75">Last-chance pieces from our most-loved collections. Once they&apos;re gone, they&apos;re gone.</p>
              <span className="mt-8 inline-flex h-12 w-fit items-center gap-3 bg-white px-7 text-[12px] font-bold uppercase tracking-[0.18em] text-[#141414] transition group-hover:bg-accent group-hover:text-white">
                Shop the sale <ArrowRight className="size-4" />
              </span>
            </div>
            <div className="relative min-h-[300px] md:min-h-[480px]">
              <Image src={image} alt="Sale collection" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition duration-[1400ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald via-emerald/20 to-transparent max-md:bg-gradient-to-b" />
            </div>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}

export function TrustBadges({ freeDeliveryThreshold, compact }: { freeDeliveryThreshold: number; compact?: boolean }) {
  const items = [
    { icon: Banknote, title: "Cash on Delivery", text: "Pay when it arrives, nationwide" },
    { icon: Truck, title: "Free delivery", text: `On orders above ${formatPKR(freeDeliveryThreshold)}` },
    { icon: RefreshCcw, title: "Easy exchanges", text: "Hassle-free size exchanges" },
    { icon: ShieldCheck, title: "Secure payments", text: "JazzCash, EasyPaisa & COD" },
  ];
  if (compact) {
    return (
      <ul className="grid grid-cols-2 gap-3">
        {items.map(({ icon: I, title }) => (
          <li key={title} className="flex items-center gap-2.5 text-xs font-medium"><I className="size-4 shrink-0 text-accent" strokeWidth={1.6} />{title}</li>
        ))}
      </ul>
    );
  }
  return (
    <section className="border-y border-border bg-surface">
      <ul className="container-x grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4 md:py-12">
        {items.map(({ icon: I, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-3 px-2 text-center md:flex-row md:text-left">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-accent"><I className="size-5" strokeWidth={1.5} /></span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Testimonials({ items }: { items: { id: string; name: string; rating: number; title: string; body: string; city: string }[] }) {
  return (
    <section className="overflow-hidden py-16 md:py-24">
      <div className="container-x">
        <SectionHeading eyebrow="Loved across Pakistan" title="What our customers say" align="center" />
      </div>
      <div className="relative">
        <div className="flex w-max animate-marquee gap-5 hover:[animation-play-state:paused]">
          {[...items, ...items].map((t, k) => (
            <figure key={`${t.id}-${k}`} className="w-[300px] shrink-0 rounded-[6px] border border-border bg-surface p-7 md:w-[380px]" aria-hidden={k >= items.length}>
              <Rating value={t.rating} />
              <blockquote className="mt-4">
                <p className="font-display text-xl leading-snug">“{t.title}”</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.body}</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <span className="grid size-9 place-items-center rounded-full bg-muted font-display text-lg">{t.name[0]}</span>
                <span className="text-sm">
                  <span className="flex items-center gap-1 font-semibold">{t.name} <BadgeCheck className="size-3.5 text-success" /></span>
                  <span className="text-xs text-muted-foreground">Verified buyer · {t.city}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background md:w-40" />
      </div>
    </section>
  );
}
