"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const imgs = [...images].sort((a, b) => a.order - b.order);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // mobile: sync active index with swipe position
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };
  const goTo = useCallback((i: number) => {
    const n = (i + imgs.length) % imgs.length;
    setActive(n);
    scroller.current?.scrollTo({ left: n * scroller.current.clientWidth, behavior: "smooth" });
  }, [imgs.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActive((v) => (v + 1) % imgs.length);
      if (e.key === "ArrowLeft") setActive((v) => (v - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, imgs.length]);

  return (
    <div className="md:grid md:grid-cols-[84px_1fr] md:gap-4">
      {/* thumbnails (desktop) */}
      <div className="no-scrollbar hidden max-h-[760px] flex-col gap-3 overflow-y-auto md:flex" role="tablist" aria-label="Product images">
        {imgs.map((im, i) => (
          <button
            key={im.url + i}
            role="tab"
            aria-selected={i === active}
            aria-label={`Show image ${i + 1}`}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            className={cn("relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-[4px] bg-muted transition", i === active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100")}
          >
            <Image src={im.url} alt="" fill sizes="84px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* main image (desktop) with hover zoom */}
      <div
        className="relative hidden aspect-[3/4] cursor-zoom-in overflow-hidden rounded-[6px] bg-muted md:block"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setLightbox(true)}
      >
        <AnimatePresence initial={false}>
          <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Image
              src={imgs[active].url}
              alt={imgs[active].alt || `${name} — image ${active + 1}`}
              fill
              priority
              sizes="(max-width:1280px) 50vw, 640px"
              className="object-cover transition-transform duration-300 ease-out"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        <button onClick={(e) => { e.stopPropagation(); setLightbox(true); }} className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-background/85 backdrop-blur transition hover:scale-105" aria-label="View full screen">
          <Expand className="size-4" />
        </button>
        <span className="absolute bottom-4 left-4 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold tabular-nums backdrop-blur">{active + 1} / {imgs.length}</span>
      </div>

      {/* mobile swipe */}
      <div className="relative -mx-4 md:hidden">
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {imgs.map((im, i) => (
            <button key={im.url + i} onClick={() => setLightbox(true)} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-muted" aria-label={`Open image ${i + 1} full screen`}>
              <Image src={im.url} alt={im.alt || `${name} — image ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {imgs.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Image ${i + 1}`} className={cn("h-1.5 rounded-full bg-white/90 shadow transition-all", i === active ? "w-6" : "w-1.5 opacity-60")} />
          ))}
        </div>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto md:hidden">
        {imgs.map((im, i) => (
          <button key={im.url + i} onClick={() => goTo(i)} className={cn("relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-[4px]", i === active ? "ring-2 ring-foreground" : "opacity-60")} aria-label={`Show image ${i + 1}`}>
            <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* lightbox */}
      <Dialog.Root open={lightbox} onOpenChange={setLightbox}>
        <Dialog.Portal>
          <Dialog.Content className="fixed inset-0 z-[100] bg-[#0e0e0e] outline-none data-[state=open]:animate-[fade-in_.3s_ease]">
            <Dialog.Title className="sr-only">{name} images</Dialog.Title>
            <Dialog.Description className="sr-only">Use arrow keys to browse images</Dialog.Description>
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setActive((v) => (v + 1) % imgs.length);
                if (info.offset.x > 60) setActive((v) => (v - 1 + imgs.length) % imgs.length);
              }}
            >
              <Image src={imgs[active].url} alt={imgs[active].alt || name} fill sizes="100vw" className="pointer-events-none object-contain" />
            </motion.div>
            <Dialog.Close className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
            {imgs.length > 1 && (
              <>
                <button onClick={() => setActive((v) => (v - 1 + imgs.length) % imgs.length)} className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous image"><ChevronLeft /></button>
                <button onClick={() => setActive((v) => (v + 1) % imgs.length)} className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next image"><ChevronRight /></button>
              </>
            )}
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-semibold tabular-nums text-white/80">{active + 1} / {imgs.length}</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
