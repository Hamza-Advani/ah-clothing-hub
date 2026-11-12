import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-[2px] border border-border bg-surface text-[15px] text-foreground transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60 aria-invalid:border-sale aria-invalid:focus:ring-sale/20";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} aria-invalid={invalid || undefined} className={cn(base, "h-12 px-4", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(base, "min-h-28 px-4 py-3", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(base, "h-12 appearance-none px-4 pr-10", className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";
