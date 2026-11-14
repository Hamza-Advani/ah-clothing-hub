"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@/lib/types";
import { EASE } from "./reveal";
import { cn } from "@/lib/utils";

const DURATION = 6500;

export function HeroSlider({ banners }: { banners: HeroBanner[] }) {
  const slides = [...banners].sort((a, b) => a.order - b.order);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = useCallback(() => setI((v) => (v + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setI((v) => (v - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setTimeout(next, DURATION);
    return () => clearTimeout(t);
  }, [i, paused, next, slides.length]);

  if (!slides.length) return null;
  const s = slides[i];
  const light = s.tone === "light"; // desktop only — mobile always uses the dark bottom fade

  return (
    <section
      className="relative h-[calc(100svh-100px)] min-h-[560px] overflow-hidden bg-[#141414] text-white md:h-[calc(100svh-116px)] md:max-h-[900px]"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={s.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next();
            else if (info.offset.x > 60) prev();
          }}
        >
          <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: "linear" }}>
            <Image src={s.image} alt={s.title} fill priority={i === 0} sizes="100vw" className={cn("pointer-events-none object-cover object-[center_25%] select-none", s.mobileImage && "hidden md:block")} />
            {s.mobileImage && <Image src={s.mobileImage} alt={s.title} fill priority={i === 0} sizes="100vw" className="pointer-events-none object-cover object-[center_20%] select-none md:hidden" />}
          </motion.div>
          <div className={cn("absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 md:bg-gradient-to-r md:via-35% md:to-transparent", light ? "md:from-[#FAF7F2]/90 md:via-[#FAF7F2]/45" : "md:from-black/65 md:via-black/25")} />
        </motion.div>
      </AnimatePresence>

      <div className="container-x relative flex h-full items-end pb-24 md:items-center md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div key={s.id} className={cn("max-w-xl", light && "md:text-[#141414]")} initial="hidden" animate="show" exit="exit" variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}>
            {s.eyebrow && (
              <motion.p variants={item} className={cn("eyebrow mb-5 flex items-center gap-3 text-[#e6d3b0]", light && "md:text-accent")}>
                <span className="h-px w-8 bg-accent" />
                {s.eyebrow}
              </motion.p>
            )}
            <motion.h1 variants={item} className="text-[48px] font-medium leading-[0.95] md:text-[84px]">
              {s.title.split(" ").map((w, k, arr) => (
                <span key={k}>{k === arr.length - 1 ? <em className={cn("font-normal text-[#e6d3b0]", light && "md:text-accent")}>{w}</em> : w} </span>
              ))}
            </motion.h1>
            <motion.p variants={item} className={cn("mt-5 max-w-md text-[15px] leading-7 text-white/80 md:text-base", light && "md:text-[#141414]/70")}>
              {s.subtitle}
            </motion.p>
            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Link href={s.ctaLink} className={cn("group inline-flex h-13 items-center gap-3 bg-white px-8 text-[12px] font-bold uppercase tracking-[0.18em] text-[#141414] transition hover:bg-accent hover:text-white", light && "md:bg-[#141414] md:text-[#FAF7F2]")}>
                {s.ctaLabel}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/shop" className={cn("inline-flex h-13 items-center border border-white/50 px-8 text-[12px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm transition hover:border-white hover:bg-white/10", light && "md:border-[#141414]/40 md:hover:border-[#141414] md:hover:bg-[#141414]/5")}>
                Shop all
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className={cn("absolute inset-x-0 bottom-6 transition-colors duration-700 md:bottom-10", light && "md:text-[#141414]")}>
          <div className="container-x flex items-center justify-between gap-6">
            <div className="flex flex-1 gap-2 md:max-w-sm">
              {slides.map((sl, k) => (
                <button key={sl.id} onClick={() => setI(k)} className="group h-6 flex-1" aria-label={`Go to slide ${k + 1}`} aria-current={k === i}>
                  <span className={cn("block h-[2px] overflow-hidden bg-white/30", light && "md:bg-[#141414]/20")}>
                    {k === i ? (
                      <motion.span key={`${i}-${paused}`} className={cn("block h-full bg-white", light && "md:bg-[#141414]")} initial={{ width: "0%" }} animate={{ width: paused ? undefined : "100%" }} transition={{ duration: DURATION / 1000, ease: "linear" }} />
                    ) : (
                      <span className={k < i ? cn("block h-full w-full bg-white/70", light && "md:bg-[#141414]/60") : ""} />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-2 hidden font-display text-lg tabular-nums md:inline">
                0{i + 1} <span className="opacity-50">/ 0{slides.length}</span>
              </span>
              <button onClick={prev} className={cn("grid size-11 place-items-center rounded-full border border-white/30 transition hover:bg-white hover:text-black", light && "md:border-[#141414]/30 md:hover:bg-[#141414] md:hover:text-white")} aria-label="Previous slide">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={next} className={cn("grid size-11 place-items-center rounded-full border border-white/30 transition hover:bg-white hover:text-black", light && "md:border-[#141414]/30 md:hover:bg-[#141414] md:hover:text-white")} aria-label="Next slide">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.35 } },
};
