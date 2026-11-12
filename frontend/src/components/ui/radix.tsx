"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as A from "@radix-ui/react-accordion";
import * as C from "@radix-ui/react-checkbox";
import * as S from "@radix-ui/react-switch";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Sheet (drawer) ---------- */
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

type Side = "right" | "left" | "bottom";
const sideClass: Record<Side, string> = {
  right: "inset-y-0 right-0 h-full w-full max-w-[440px] data-[state=open]:animate-[sheet-in-right_.45s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-right_.3s_ease-in]",
  left: "inset-y-0 left-0 h-full w-[88%] max-w-[380px] data-[state=open]:animate-[sheet-in-left_.45s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-left_.3s_ease-in]",
  bottom: "inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-2xl data-[state=open]:animate-[sheet-in-bottom_.45s_var(--ease-luxe)] data-[state=closed]:animate-[sheet-out-bottom_.3s_ease-in]",
};

export function SheetContent({
  side = "right",
  className,
  children,
  title,
  description,
  hideClose,
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: Side; title: string; description?: string; hideClose?: boolean }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] data-[state=closed]:animate-[fade-out_.25s_ease] data-[state=open]:animate-[fade-in_.3s_ease]" />
      <Dialog.Content className={cn("fixed z-[90] flex flex-col bg-background shadow-lift outline-none", sideClass[side], className)} {...props}>
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        <Dialog.Description className="sr-only">{description ?? title}</Dialog.Description>
        {children}
        {!hideClose && (
          <Dialog.Close className="absolute right-3 top-3 grid size-10 place-items-center rounded-full transition hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.3s_ease]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-lift outline-none data-[state=open]:animate-[pop-in_.35s_var(--ease-luxe)] md:p-8",
            className,
          )}
        >
          <Dialog.Title className="pr-10 font-display text-2xl">{title}</Dialog.Title>
          <Dialog.Description className={description ? "mt-1 text-sm text-muted-foreground" : "sr-only"}>{description ?? title}</Dialog.Description>
          <div className="mt-5">{children}</div>
          <Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-full transition hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- Accordion ---------- */
export const Accordion = A.Root;

export function AccordionItem({ value, title, children, className }: { value: string; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <A.Item value={value} className={cn("border-b border-border", className)}>
      <A.Header>
        <A.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold">
          {title}
          <Plus className="size-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-45" />
        </A.Trigger>
      </A.Header>
      <A.Content className="overflow-hidden text-[15px] text-muted-foreground data-[state=closed]:animate-[acc-up_.3s_ease] data-[state=open]:animate-[acc-down_.35s_var(--ease-luxe)]">
        <div className="pb-5">{children}</div>
      </A.Content>
    </A.Item>
  );
}

/* ---------- Checkbox / Switch ---------- */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[3px] border border-foreground/40 bg-surface transition data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <C.Indicator>
        <Check className="size-3" strokeWidth={3} />
      </C.Indicator>
    </C.Root>
  );
}

export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root className={cn("relative h-6 w-11 shrink-0 rounded-full bg-border transition-colors data-[state=checked]:bg-emerald", className)} {...props}>
      <S.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  );
}
