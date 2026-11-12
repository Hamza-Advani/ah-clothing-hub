import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.14em]",
  {
    variants: {
      variant: {
        new: "bg-primary text-primary-foreground",
        sale: "bg-sale text-white",
        bestseller: "bg-accent text-white",
        soldout: "bg-muted-foreground text-white",
        outline: "border border-border text-muted-foreground",
        success: "bg-success/12 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-sale/12 text-sale",
        neutral: "bg-muted text-foreground",
        info: "bg-emerald/12 text-emerald",
      },
      shape: { sharp: "rounded-[2px]", pill: "rounded-full px-2.5" },
    },
    defaultVariants: { variant: "neutral", shape: "sharp" },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function Badge({ className, variant, shape, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, shape }), className)} {...props} />;
}
