"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DM from "@radix-ui/react-dropdown-menu";
import {
  BarChart3, Bell, ChevronsLeft, ExternalLink, FileText, FolderTree, KeyRound, LayoutDashboard, LogOut, Mail, Menu, Moon, Package, Settings, ShieldCheck, ShoppingBag, Star, Sun, Ticket, UserCog, Users,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/radix";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdminData } from "./admin-data";
import { timeAgo } from "./ui";
import { adminDemoMode, useLiveDoc } from "@/lib/admin/live";
import { ROUTE_PERMISSION } from "@/lib/admin/permissions";
import type { AdminMember } from "@/lib/admin/demo";

const noDemo = () => null;
import { cn, formatPKR } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; adminOnly?: boolean };

function useNav(): { title: string; items: NavItem[] }[] {
  const { orders, messages, reviews } = useAdminData();
  const pending = orders?.filter((o) => o.status === "pending").length ?? 0;
  const unread = messages?.filter((m) => !m.read).length ?? 0;
  const pendingReviews = reviews?.filter((r) => r.status === "pending").length ?? 0;
  return [
    {
      title: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/analytics", label: "Analytics & reports", icon: BarChart3 },
      ],
    },
    {
      title: "Store",
      items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: pending },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: FolderTree },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/coupons", label: "Coupons", icon: Ticket },
        { href: "/admin/reviews", label: "Reviews", icon: Star, badge: pendingReviews },
        { href: "/admin/messages", label: "Messages", icon: Mail, badge: unread },
      ],
    },
    {
      title: "Configure",
      items: [
        { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
        { href: "/admin/pages", label: "Pages & FAQ", icon: FileText, adminOnly: true },
        { href: "/admin/team", label: "Team & roles", icon: UserCog, adminOnly: true },
        { href: "/admin/account", label: "My account", icon: KeyRound },
      ],
    },
  ];
}

function isActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");
}

function AdminMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin dashboard">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald font-display text-[17px] font-semibold text-[#f2efea] dark:bg-[#1f3d36]">AH</span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight">AH Clothing Hub</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Admin</span>
        </span>
      )}
    </Link>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const { isAdmin, user } = useAuth();
  const groups = useNav();
  // staff only see the sections they were given access to
  const me = useLiveDoc<AdminMember>(!isAdmin && user ? `admins/${user.uid}` : null, noDemo);
  const perms = me?.permissions ?? [];
  const allowed = (href: string) => isAdmin || adminDemoMode || perms.includes("*") || !ROUTE_PERMISSION[href] || perms.includes(ROUTE_PERMISSION[href]);
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
      {groups.map((g) => (
        <div key={g.title}>
          {!collapsed && <p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items
              .filter((i) => (!i.adminOnly || isAdmin || adminDemoMode) && allowed(i.href))
              .map((i) => {
                const active = isActive(path, i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      title={collapsed ? i.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition",
                        active ? "bg-foreground text-background" : "text-foreground/75 hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <i.icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                      {!collapsed && <span className="flex-1 truncate">{i.label}</span>}
                      {!!i.badge && (
                        <span
                          className={cn(
                            "grid min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-bold tabular-nums",
                            active ? "bg-background text-foreground" : "bg-accent text-white",
                            collapsed && "absolute right-1 top-1 h-4 min-w-4 px-1 text-[9px]",
                          )}
                        >
                          {i.badge > 99 ? "99+" : i.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // the inline script in the root layout already set the class before paint
    // apply saved preference (also re-applies after a dev StrictMode remount)
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("ah-admin-theme");
    } catch {}
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
    const sync = () => setDark(isDark);
    Promise.resolve().then(sync);
    return () => document.documentElement.classList.remove("dark"); // leave storefront in light mode
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ah-admin-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };
  return { dark, toggle };
}

function NotificationsMenu() {
  const { orders } = useAdminData();
  const recent = (orders ?? []).slice(0, 6);
  const pending = orders?.filter((o) => o.status === "pending").length ?? 0;
  return (
    <DM.Root>
      <DM.Trigger className="relative grid size-9 place-items-center rounded-lg text-foreground/80 transition hover:bg-muted" aria-label="Recent orders">
        <Bell className="size-[18px]" />
        {pending > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-sale ring-2 ring-surface" />}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-[70] w-80 rounded-xl border border-border bg-surface p-1.5 shadow-lift">
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-muted-foreground">Latest orders · {pending} pending</p>
          {recent.length === 0 && <p className="px-2.5 py-4 text-sm text-muted-foreground">No orders yet.</p>}
          {recent.map((o) => (
            <DM.Item key={o.id} asChild>
              <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{o.orderNumber} · {o.customer.name}</span>
                  <span className="text-xs text-muted-foreground">{o.shipping.city} · {timeAgo(o.createdAt)}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums">{formatPKR(o.total)}</span>
              </Link>
            </DM.Item>
          ))}
          <DM.Item asChild>
            <Link href="/admin/orders" className="mt-1 block rounded-lg px-2.5 py-2 text-center text-xs font-semibold text-accent outline-none data-[highlighted]:bg-muted">
              View all orders
            </Link>
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

function UserMenu() {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const name = user?.name ?? "Admin";
  return (
    <DM.Root>
      <DM.Trigger className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-muted" aria-label="Account menu">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-[13px] font-bold uppercase text-white">{name.slice(0, 1)}</span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[140px] truncate text-[13px] font-semibold">{name}</span>
          <span className="block text-[11px] capitalize text-muted-foreground">{adminDemoMode ? "Demo preview" : role}</span>
        </span>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-[70] w-56 rounded-xl border border-border bg-surface p-1.5 text-sm shadow-lift">
          <div className="px-2.5 py-2">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DM.Separator className="my-1 h-px bg-border" />
          {[
            { href: "/admin/account", label: "Profile", icon: UserCog },
            { href: "/admin/account#password", label: "Change password", icon: KeyRound },
            { href: "/", label: "View store", icon: ExternalLink },
          ].map((i) => (
            <DM.Item key={i.href} asChild>
              <Link href={i.href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-muted">
                <i.icon className="size-4 text-muted-foreground" /> {i.label}
              </Link>
            </DM.Item>
          ))}
          <DM.Separator className="my-1 h-px bg-border" />
          <DM.Item
            onSelect={async () => {
              await signOut();
              router.replace("/admin/login");
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sale outline-none data-[highlighted]:bg-sale/10"
          >
            <LogOut className="size-4" /> Sign out
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    try {
      if (localStorage.getItem("ah-admin-sidebar") === "1") Promise.resolve().then(() => setCollapsed(true));
    } catch {}
  }, []);
  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("ah-admin-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  return (
    <div className="admin-skin min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-300 ease-[var(--ease-luxe)] lg:flex", collapsed ? "w-[76px]" : "w-[264px]")}>
        <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
          <AdminMark collapsed={collapsed} />
        </div>
        <NavList collapsed={collapsed} />
        <div className="border-t border-border p-3">
          <button onClick={toggleCollapse} className={cn("flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground", collapsed && "justify-center px-0")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" title="Admin menu" className="admin-skin flex flex-col bg-surface">
          <div className="flex h-16 items-center border-b border-border px-5">
            <AdminMark />
          </div>
          <NavList onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-[padding] duration-300 ease-[var(--ease-luxe)]", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border px-4 md:px-6">
          <button className="grid size-9 place-items-center rounded-lg hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <AdminMark collapsed />
          </div>
          <div className="flex-1" />
          {adminDemoMode && (
            <span className="hidden items-center gap-1.5 rounded-full bg-warning/12 px-3 py-1 text-xs font-semibold text-warning sm:inline-flex">
              <ShieldCheck className="size-3.5" /> Demo data
            </span>
          )}
          <Link href="/" target="_blank" className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-foreground/80 transition hover:bg-muted sm:inline-flex">
            <ExternalLink className="size-4" /> View store
          </Link>
          <button onClick={toggle} className="grid size-9 place-items-center rounded-lg text-foreground/80 transition hover:bg-muted" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <NotificationsMenu />
          <div className="mx-1 h-6 w-px bg-border" />
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
