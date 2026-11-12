import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[0.99]",
        accent: "bg-accent text-accent-foreground hover:brightness-95 active:scale-[0.99]",
        outline: "border border-foreground/90 bg-transparent text-foreground hover:bg-foreground hover:text-background",
        subtle: "border border-border bg-surface text-foreground hover:border-foreground/40",
        ghost: "text-foreground hover:bg-muted",
        link: "h-auto px-0 text-foreground underline-offset-4 hover:underline",
        destructive: "bg-sale text-white hover:bg-sale/90",
      },
      size: {
        sm: "h-9 px-4 text-[11px] uppercase tracking-[0.16em]",
        md: "h-11 px-6 text-[12px] uppercase tracking-[0.16em]",
        lg: "h-13 px-8 text-[12px] uppercase tracking-[0.18em]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
      shape: { sharp: "rounded-[2px]", soft: "rounded-lg", pill: "rounded-full" },
    },
    compoundVariants: [{ variant: "link", className: "normal-case tracking-normal text-sm" }],
    defaultVariants: { variant: "primary", size: "md", shape: "sharp" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, shape }), className)} disabled={disabled || loading} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
