"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "./logo";
import { Sheet, SheetContent } from "@/components/ui/radix";
import { useUI } from "@/store/ui";
import { cartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/hooks/use-mounted";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export function Header({ categories, logoUrl, whatsapp }: { categories: Category[]; logoUrl?: string | null; whatsapp: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const { setCartOpen, setSearchOpen, menuOpen, setMenuOpen } = useUI();
  const items = useCart((s) => s.items);
  const wish = useWishlist((s) => s.ids);
  const mounted = useMounted();
  const { user } = useAuth();
  const count = mounted ? cartCount(items) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeOnLink = (close: () => void) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) close();
  };

  const nav = [
    { label: "New In", href: "/shop?filter=new" },
    ...categories.slice(0, 3).map((c) => ({ label: c.name.replace(/^Women\s+/i, ""), href: `/category/${c.slug}` })),
    { label: "Sale", href: "/shop?filter=sale", accent: true },
  ];

  return (
    <header className={cn("sticky top-0 z-40 transition-[background,box-shadow] duration-500", scrolled ? "glass shadow-[0_1px_0_var(--border)]" : "bg-background")}>
      <div className="container-x">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          {/* left */}
          <div className="flex items-center gap-1">
            <button className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-muted xl:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" />
            </button>
            <button className="grid size-10 place-items-center rounded-full hover:bg-muted xl:hidden" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </button>
            <nav className="hidden items-center gap-6 whitespace-nowrap xl:flex 2xl:gap-8" aria-label="Main">
              <div onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)} className="relative">
                <Link href="/shop" className="eyebrow py-8 text-[11.5px] tracking-[0.18em] hover:text-accent" onFocus={() => setMega(true)} aria-expanded={mega}>
                  Shop
                </Link>
              </div>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMega(false)} className={cn("eyebrow link-underline text-[11.5px] tracking-[0.18em]", n.accent && "text-sale")}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <Logo logoUrl={logoUrl} />

          {/* right */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="mr-2 hidden h-10 w-56 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-4 text-sm text-muted-foreground transition hover:border-foreground/30 xl:flex 2xl:w-64"
              aria-label="Search products"
            >
              <Search className="size-4 shrink-0" /> <span className="truncate">Search products…</span>
              <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">/</kbd>
            </button>
            <Link href={user ? "/account" : "/login"} className="hidden size-10 place-items-center rounded-full hover:bg-muted sm:grid" aria-label="Account">
              <User className="size-5" />
            </Link>
            <Link href="/wishlist" className="relative grid size-10 place-items-center rounded-full hover:bg-muted" aria-label={`Wishlist (${mounted ? wish.length : 0})`}>
              <Heart className="size-5" />
              {mounted && wish.length > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-white">{wish.length}</span>}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative -mr-2 grid size-10 place-items-center rounded-full hover:bg-muted" aria-label={`Cart (${count} items)`}>
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[18px] text-primary-foreground"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mega menu */}
      <AnimatePresence>
        {mega && (
          <motion.div
            onMouseEnter={() => setMega(true)}
            onMouseLeave={() => setMega(false)}
            onClick={closeOnLink(() => setMega(false))}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full hidden border-t border-border bg-background shadow-lift xl:block"
          >
            <div className="container-x grid grid-cols-[220px_1fr] gap-10 py-10">
              <div className="space-y-3">
                <p className="eyebrow text-muted-foreground">Discover</p>
                {[
                  ["All products", "/shop"],
                  ["New arrivals", "/shop?filter=new"],
                  ["Best sellers", "/shop?filter=bestsellers"],
                  ["Sale", "/shop?filter=sale"],
                ].map(([l, h]) => (
                  <Link key={h} href={h} className="block font-display text-2xl hover:text-accent">
                    {l}
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-4">
                {categories.map((c) => (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-muted">
                      <Image src={c.image.url} alt={c.name} fill sizes="200px" className="object-cover transition duration-700 group-hover:scale-105" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" title="Menu" className="overflow-y-auto" onClick={closeOnLink(() => setMenuOpen(false))}>
          <div className="border-b border-border px-6 py-5">
            <Logo logoUrl={logoUrl} />
          </div>
          <nav className="flex-1 px-6 py-4" aria-label="Mobile">
            {[{ label: "Shop all", href: "/shop" }, ...nav].map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex items-center justify-between border-b border-border/70 py-4 font-display text-[26px]", "accent" in n && n.accent && "text-sale")}>
                {n.label}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group relative aspect-square overflow-hidden rounded-[6px]">
                  <Image src={c.image.url} alt={c.name} fill sizes="45vw" className="object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">{c.name}</span>
                </Link>
              ))}
            </div>
          </nav>
          <div className="space-y-3 border-t border-border px-6 py-5 text-sm">
            <Link href={user ? "/account" : "/login"} className="flex items-center gap-3 font-semibold">
              <User className="size-4" /> {user ? `Hi, ${user.name.split(" ")[0]}` : "Login / Sign up"}
            </Link>
            <Link href="/account/orders" className="block text-muted-foreground">Track my order</Link>
            <Link href="/contact" className="block text-muted-foreground">Contact us</Link>
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} className="block text-muted-foreground">WhatsApp: {whatsapp}</a>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
