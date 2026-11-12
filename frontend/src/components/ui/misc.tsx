import Link from "next/link";
import { ArrowRight, Star, type LucideIcon } from "lucide-react";
import { cn, discountPercent, formatPKR } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton rounded-[4px]", className)} {...props} />;
}

export function Rating({ value, size = 14, className, showValue }: { value: number; size?: number; className?: string; showValue?: boolean }) {
  const stars = (cls: string) =>
    Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cls} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="relative inline-flex">
        <span className="flex text-border">{stars("shrink-0")}</span>
        <span className="absolute inset-0 flex overflow-hidden text-accent" style={{ width: `${(value / 5) * 100}%` }}>
          {stars("shrink-0")}
        </span>
      </span>
      {showValue && <span className="text-xs font-semibold text-foreground">{value.toFixed(1)}</span>}
    </span>
  );
}

export function Price({ price, salePrice, className, size = "md" }: { price: number; salePrice?: number | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const onSale = salePrice != null && salePrice < price;
  const sz = size === "lg" ? "text-2xl" : size === "sm" ? "text-[13px]" : "text-[15px]";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-semibold tabular-nums", sz, onSale && "text-sale")}>{formatPKR(onSale ? salePrice! : price)}</span>
      {onSale && (
        <>
          <span className={cn("tabular-nums text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>{formatPKR(price)}</span>
          {size === "lg" && <span className="text-xs font-bold uppercase tracking-wider text-sale">Save {discountPercent(price, salePrice)}%</span>}
        </>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="mb-6 grid size-20 place-items-center rounded-full bg-muted text-accent">
        <Icon className="size-8" strokeWidth={1.4} />
      </div>
      <h3 className="font-display text-3xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  align = "between",
  className,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  align?: "between" | "center";
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex gap-4 md:mb-12", align === "center" ? "flex-col items-center text-center" : "items-end justify-between", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-accent">{eyebrow}</p>}
        <h2 className="text-[34px] font-medium leading-[1.05] md:text-[48px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-2 pb-2 text-[12px] font-semibold uppercase tracking-[0.16em] sm:inline-flex">
          <span className="link-underline">{linkLabel}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-muted/60">
      <div className="container-x py-12 text-center md:py-20">
        {eyebrow && <p className="eyebrow mb-4 text-accent">{eyebrow}</p>}
        <h1 className="text-[42px] font-medium leading-none md:text-[64px]">{title}</h1>
        {description && <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{description}</p>}
        {children}
      </div>
    </header>
  );
}

export function Prose({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-muted-foreground [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-foreground [&_li]:mb-1 [&_p]:mb-4 [&_strong]:text-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
