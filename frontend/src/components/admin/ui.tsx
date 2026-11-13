"use client";
import * as React from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Search, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/radix";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

/* ---------- Layout ---------- */
export function PageHeader({ title, description, actions, back }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight md:text-[30px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface shadow-soft", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Buttons & inputs (admin = soft radius, normal case) ---------- */
export const AButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, size, ...props }, ref) => (
  <Button
    ref={ref}
    shape="soft"
    size={size === "icon" || size === "icon-sm" ? size : undefined}
    className={cn(size === "icon" || size === "icon-sm" ? "" : size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13px]", "normal-case tracking-normal", className)}
    {...props}
  />
));
AButton.displayName = "AButton";

const inputBase =
  "w-full rounded-lg border border-border bg-surface text-sm text-foreground transition placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60 aria-invalid:border-sale";

export const AInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(({ className, invalid, ...p }, ref) => (
  <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, "h-10 px-3", className)} {...p} />
));
AInput.displayName = "AInput";

export const ATextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(({ className, invalid, ...p }, ref) => (
  <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, "min-h-24 px-3 py-2.5 leading-relaxed", className)} {...p} />
));
ATextarea.displayName = "ATextarea";

export const ASelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <div className={cn("relative", className)}>
    <select ref={ref} className={cn(inputBase, "h-10 appearance-none pl-3 pr-9")} {...p}>
      {children}
    </select>
    <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </div>
));
ASelect.displayName = "ASelect";

export function AField({ label, hint, error, children, className, htmlFor }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-foreground/85">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-sale">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <AInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  );
}

/** Segmented control (pill tabs). */
export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("no-scrollbar inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-muted/60 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition",
            value === o.value ? "bg-surface text-foreground shadow-soft" : "hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Stat card ---------- */
export function StatCard({ label, value, delta, icon: Icon, hint, tone = "default", invertDelta }: { label: string; value: React.ReactNode; delta?: number | null; icon: LucideIcon; hint?: string; tone?: "default" | "warning" | "danger"; invertDelta?: boolean }) {
  const up = (delta ?? 0) >= 0;
  const good = invertDelta ? !up : up;
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone === "warning" ? "bg-warning/12 text-warning" : tone === "danger" ? "bg-sale/10 text-sale" : "bg-emerald/10 text-emerald dark:text-[#6fb7a3]")}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 truncate text-[22px] font-bold tabular-nums tracking-tight md:text-[24px]">{value}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {delta !== undefined &&
          (delta === null ? (
            <span className="font-semibold text-success">New</span>
          ) : (
            <span className={cn("inline-flex items-center font-semibold tabular-nums", delta === 0 ? "text-muted-foreground" : good ? "text-success" : "text-sale")}>
              {delta !== 0 && (up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ))}
        {hint && <span className="truncate text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}

/* ---------- Status badges ---------- */
const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "neutral",
  delivered: "success",
  cancelled: "danger",
  returned: "danger",
};
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} shape="pill" className="normal-case tracking-normal text-[11px] font-semibold">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

const PAY_VARIANT: Record<PaymentStatus, BadgeVariant> = { pending: "neutral", awaiting_approval: "warning", paid: "success", rejected: "danger" };
const PAY_LABEL: Record<PaymentStatus, string> = { pending: "Unpaid", awaiting_approval: "Needs approval", paid: "Paid", rejected: "Rejected" };
export function PaymentBadge({ status, method }: { status: PaymentStatus; method?: string }) {
  return (
    <span className="inline-flex flex-col gap-0.5">
      <Badge variant={PAY_VARIANT[status]} shape="pill" className="w-fit normal-case tracking-normal text-[11px] font-semibold">
        {PAY_LABEL[status]}
      </Badge>
      {method && <span className="text-[11px] text-muted-foreground">{PAYMENT_LABELS[method] ?? method}</span>}
    </span>
  );
}

/* ---------- Table ---------- */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px] [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
        {children}
      </table>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="skeleton h-5 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyBlock({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted text-accent">
        <Icon className="size-6" strokeWidth={1.6} />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function usePaged<T>(items: T[], size = 20) {
  const [page, setPage] = React.useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const cur = Math.min(page, pages);
  return { page: cur, pages, setPage, slice: items.slice((cur - 1) * size, cur * size), total: items.length, size };
}

export function Pager({ page, pages, setPage, total, size }: { page: number; pages: number; setPage: (n: number) => void; total: number; size: number }) {
  if (total <= size) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>
        {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <AButton variant="subtle" size="icon-sm" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </AButton>
        <span className="px-2 font-semibold text-foreground tabular-nums">
          {page} / {pages}
        </span>
        <AButton variant="subtle" size="icon-sm" onClick={() => setPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight />
        </AButton>
      </div>
    </div>
  );
}

/* ---------- Dialogs ---------- */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} className="max-w-md">
      <div className="flex justify-end gap-2">
        <AButton variant="subtle" onClick={() => onOpenChange(false)}>
          Cancel
        </AButton>
        <AButton
          variant={destructive ? "destructive" : "primary"}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </AButton>
      </div>
    </Modal>
  );
}

export function FullLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-accent" />
        {label}
      </div>
    </div>
  );
}

export function Thumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <span className={cn("block size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : null}
    </span>
  );
}

export function timeAgo(t: number) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export const dateTime = (t: number) => new Date(t).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
