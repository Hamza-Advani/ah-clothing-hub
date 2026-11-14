"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Heart, KeyRound, LayoutDashboard, LogOut, MapPin, Package, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Password & security", icon: KeyRound },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, isStaff } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user)
    return (
      <div className="container-x grid gap-8 py-12 md:grid-cols-[260px_1fr]">
        <div className="skeleton h-72 rounded-[6px]" />
        <div className="space-y-4"><div className="skeleton h-10 w-64" /><div className="skeleton h-48 rounded-[6px]" /></div>
      </div>
    );

  return (
    <div className="container-x py-8 md:py-14">
      <div className="mb-8 flex items-center gap-4 md:mb-12">
        <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-2xl text-primary-foreground">{user.name[0]?.toUpperCase()}</span>
        <div>
          <p className="eyebrow text-accent">My account</p>
          <h1 className="text-[32px] font-medium leading-tight md:text-[40px]">Hello, {user.name.split(" ")[0]}</h1>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-[240px_1fr] md:gap-12">
        <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-1 md:px-0">
          {NAV.map(({ href, label, icon: I }) => {
            const active = href === "/account" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition md:rounded-[4px]", active ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted md:bg-transparent")}>
                <I className="size-4" /> {label}
              </Link>
            );
          })}
          {isStaff && (
            <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-emerald hover:bg-muted md:rounded-[4px]"><ShieldCheck className="size-4" /> Admin panel</Link>
          )}
          <button
            onClick={async () => { await signOut(); toast("You've been logged out"); router.push("/"); }}
            className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-sale md:mt-4 md:rounded-[4px] md:border-t md:border-border md:pt-5"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
