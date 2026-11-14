import { BRAND_IMAGES } from "@/lib/defaults";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Gem, HandHeart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prose } from "@/components/ui/misc";
import { Reveal } from "@/components/store/reveal";
import { getPages, getSettings } from "@/lib/catalog";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description: "Meet AH Clothing Hub — an online clothing store in Pakistan bringing classic style and modern design together in eastern and western wear for women, men and kids.",
  path: "/about",
});

export default async function AboutPage() {
  const [pages, settings] = await Promise.all([getPages(), getSettings()]);
  return (
    <>
      <section className="relative overflow-hidden bg-[#141414] text-white">
        <Image src={settings.heroBanners[0]?.image || BRAND_IMAGES[0]} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
        <div className="container-x relative py-28 text-center md:py-40">
          <p className="eyebrow mb-4 text-[#e6d3b0]">Our story</p>
          <h1 className="mx-auto max-w-3xl text-[48px] font-medium leading-[0.98] md:text-[80px]">Made with heritage, <em className="font-normal text-[#e6d3b0]">worn</em> with pride</h1>
        </div>
      </section>
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1fr_1.2fr] md:py-24">
        <Reveal><h2 className="text-[36px] font-medium leading-tight md:text-[48px]">Classic style with a modern point of view.</h2></Reveal>
        <Reveal delay={0.1}><Prose html={pages.about} className="text-base" /></Reveal>
      </div>
      <section className="bg-muted/60 py-16 md:py-24">
        <div className="container-x grid gap-8 md:grid-cols-3">
          {[
            { icon: Gem, t: "Uncompromising quality", d: "Every piece is checked before it is packed and sent to you." },
            { icon: HandHeart, t: "Made for Pakistan", d: "Styles chosen for our seasons, celebrations and everyday life." },
            { icon: Leaf, t: "Thoughtful by design", d: "Timeless pieces you'll wear season after season." },
          ].map(({ icon: I, t, d }, i) => (
            <Reveal key={t} delay={i * 0.08} className="rounded-[6px] bg-surface p-8">
              <I className="size-7 text-accent" strokeWidth={1.4} />
              <h3 className="mt-6 text-2xl">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <div className="container-x py-16 text-center md:py-24">
        <h2 className="text-[36px] font-medium md:text-[48px]">Find your next favourite</h2>
        <Button asChild size="lg" className="mt-8"><Link href="/shop">Shop the collection</Link></Button>
      </div>
    </>
  );
}
